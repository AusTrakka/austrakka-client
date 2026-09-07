import { Alert, AlertTitle, Box, CircularProgress, Typography } from '@mui/material';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { Column } from 'primereact/column';
import { DataTable, type DataTableFilterMeta } from 'primereact/datatable';
import { useEffect, useMemo, useState } from 'react';
import { useStableNavigate } from '../../../app/NavigationContext';
import { type OrgMetadataState, selectOrgMetadata } from '../../../app/orgMetadataSlice';
import { type RootState, useAppSelector } from '../../../app/store';
import { Theme } from '../../../assets/themes/theme';
import MetadataLoadingState, { hasCompleteData } from '../../../constants/metadataLoadingState';
import { columnStyleRules, combineClasses } from '../../../styles/metadataFieldStyles';
import type { Sample } from '../../../types/sample.interface';
import { WidgetType } from '../../../types/widget.props';
import { updateTabUrlWithSearch } from '../../../utilities/navigationUtils';
import type { PrimeReactColumnDefinition } from '../../../utilities/tableUtils';

// Displays matrix of sample counts for projects vs a single metadata category
// Requires Shared_groups field to be present in the metadata

const SHARED_GROUPS_FIELD = 'Shared_groups';
const UNKNOWN_VALUE_LABEL = 'unknown'; // label for samples with no value for the category field
const UNSHARED_ROW = 'Unshared';

interface MetadataCountsByProjectProps {
  widgetType: WidgetType;
  identifier: string;
  title?: string;
  categoryField: string;
  filteredData: Sample[];
}

interface SharedGroupsMatrixRow {
  project: string;
  [categoryName: string]: string | number;
  Total: number;
}

function stripOwnerSuffix(value: string): string {
  return value.split('-Owner')[0];
}

function isGroupName(name: string): boolean {
  return name.endsWith('-Group');
}

function getSharedProjectNames(raw: string | undefined): string[] {
  if (!raw) return [];
  const groups: string[] = JSON.parse(raw).filter(isGroupName);
  return groups.map((g) => g.slice(0, -'-Group'.length));
}

function buildSharedGroupsMatrix(
  data: Sample[],
  categoryField: string,
): { rows: SharedGroupsMatrixRow[]; categoryColumns: PrimeReactColumnDefinition[] } {
  const matrix = new Map<string, Map<string, number>>(); // project -> category -> count
  const allCategories = new Set<string>();

  for (const sample of data) {
    const projects = getSharedProjectNames(
      sample[SHARED_GROUPS_FIELD as keyof Sample] as string | undefined,
    );

    const rawCategory = (sample[categoryField as keyof Sample] as string) ?? '';
    const strippedCategory =
      categoryField === 'Owner_group' ? stripOwnerSuffix(rawCategory) : rawCategory;
    const category = strippedCategory === '' ? UNKNOWN_VALUE_LABEL : strippedCategory;
    allCategories.add(category);

    if (projects.length === 0) {
      if (!matrix.has(UNSHARED_ROW)) matrix.set(UNSHARED_ROW, new Map());
      const categoryCounts = matrix.get(UNSHARED_ROW)!;
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
      continue;
    }

    projects.forEach((project) => {
      if (!matrix.has(project)) matrix.set(project, new Map());
      const categoryCounts = matrix.get(project)!;
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    });
  }

  const categoryColumns: PrimeReactColumnDefinition[] = [...allCategories]
    .sort((a, b) => {
      // unknown always sorts last, like it did as a row before
      if (a === UNKNOWN_VALUE_LABEL) return 1;
      if (b === UNKNOWN_VALUE_LABEL) return -1;
      return a.localeCompare(b);
    })
    .map((category) => ({ field: category, header: category }));

  const rows: SharedGroupsMatrixRow[] = [...matrix.entries()]
    .map(([project, categoryCounts]) => {
      const row: SharedGroupsMatrixRow = { project, Total: 0 };
      let total = 0;
      categoryColumns.forEach(({ field }) => {
        const count = categoryCounts.get(field) ?? 0;
        row[field] = count;
        total += count;
      });
      row.Total = total;
      return row;
    })
    .sort((a, b) => {
      // Unshared always sorts first, like it did as a column before
      const aIsUnshared = a.project === UNSHARED_ROW;
      const bIsUnshared = b.project === UNSHARED_ROW;
      if (aIsUnshared && !bIsUnshared) return -1;
      if (!aIsUnshared && bIsUnshared) return 1;
      return b.Total - a.Total; // Sort rows by total count descending
    });

  return { rows, categoryColumns };
}

function MetadataCountsByProject(props: MetadataCountsByProjectProps) {
  const { identifier, title, categoryField, widgetType } = props;
  const [rows, setRows] = useState<SharedGroupsMatrixRow[]>([]);
  const [columns, setColumns] = useState<PrimeReactColumnDefinition[]>([]);
  const { navigate } = useStableNavigate();

  const metadataSelector = useMemo(
    () => (state: RootState) => {
      switch (widgetType) {
        case WidgetType.Organisation:
          return selectOrgMetadata(state, identifier);
        default:
          throw new Error(`This widget is not supported for widget type: ${widgetType}`);
      }
    },
    [identifier, widgetType],
  );

  const data: OrgMetadataState | null = useAppSelector(metadataSelector);
  const loaded = hasCompleteData(data?.loadingState);

  const errorMessage = useMemo(() => {
    if (data?.loadingState === MetadataLoadingState.ERROR)
      return data.errorMessage ?? 'Unknown error';
    return null;
  }, [data]);

  const infoMessage = useMemo(() => {
    if (data?.fields && data.fields.length > 0) {
      const fieldNames = data.fields.map((f) => f.columnName);
      if (!fieldNames.includes(SHARED_GROUPS_FIELD))
        return `Field ${SHARED_GROUPS_FIELD} not found in ${widgetType}. Add this field to the ${widgetType} to see data.`;
      if (!fieldNames.includes(categoryField))
        return `Field ${categoryField} not found in ${widgetType}. Add this field to the ${widgetType} to see data.`;
    }
    return null;
  }, [data, categoryField, widgetType]);

  useEffect(() => {
    if (!data?.fields || errorMessage) return;
    if (data.loadingState === MetadataLoadingState.DATA_LOADED) {
      // Get counts of samples for each value of categoryField and Shared_groups
      const { rows, categoryColumns } = buildSharedGroupsMatrix(
        data.metadata as Sample[],
        categoryField,
      );
      setRows(rows);
      setColumns(categoryColumns);
    }
  }, [data?.metadata, data?.fields, data?.loadingState, categoryField, errorMessage]);

  // Project drilldown (row label click)
  const handleProjectClick = (project: string) => {
    const unsharedFlag = project === UNSHARED_ROW;

    const filters: DataTableFilterMeta = {
      [SHARED_GROUPS_FIELD]: {
        operator: FilterOperator.AND,
        constraints: [
          {
            matchMode: unsharedFlag ? FilterMatchMode.CUSTOM : FilterMatchMode.CONTAINS,
            value: unsharedFlag ? 'true' : project,
          },
        ],
      },
    };
    updateTabUrlWithSearch(navigate, '/samples', filters);
  };

  // Combined project and metadata value drilldown (cell click)
  const handleCellClick = (project: string, categoryValue: string) => {
    const unsharedFlag = project === UNSHARED_ROW;
    const unknownFlag = categoryValue === UNKNOWN_VALUE_LABEL;

    const filters: DataTableFilterMeta = {
      [SHARED_GROUPS_FIELD]: {
        operator: FilterOperator.AND,
        constraints: [
          {
            matchMode: unsharedFlag ? FilterMatchMode.CUSTOM : FilterMatchMode.CONTAINS,
            value: unsharedFlag ? 'true' : project,
          },
        ],
      },
      [categoryField]: {
        operator: FilterOperator.AND,
        constraints: [
          {
            matchMode: unknownFlag ? FilterMatchMode.CUSTOM : FilterMatchMode.EQUALS,
            value: unknownFlag ? 'true' : categoryValue,
          },
        ],
      },
    };
    updateTabUrlWithSearch(navigate, '/samples', filters);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Small scoped style for the "Unshared" row, since PrimeReact bodyStyle only targets columns */}
      <style>{`
        .unshared-row > td { background-color: ${Theme.PrimaryGrey100}; }
      `}</style>

      {title !== '' && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography
            variant="h5"
            paddingBottom={3}
            color="primary"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
          >
            {title ?? `${categoryField} counts by project`}
          </Typography>
        </Box>
      )}

      {errorMessage && (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {errorMessage}
        </Alert>
      )}

      {infoMessage && !errorMessage && <Alert severity="info">{infoMessage}</Alert>}

      {!loaded && !errorMessage && !infoMessage && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          flex={1}
          minHeight={0}
        >
          <CircularProgress size={24} />
        </Box>
      )}

      {loaded && !errorMessage && !infoMessage && (
        <Box
          flex={1}
          minHeight={0}
          sx={{
            borderTop: `1px solid ${Theme.PrimaryGrey200}`,
            borderBottom: `1px solid ${Theme.PrimaryGrey200}`,
            overflow: 'hidden',
          }}
        >
          <DataTable
            value={rows}
            size="small"
            scrollable
            scrollHeight="flex"
            className="my-flexible-table"
            emptyMessage="No data available"
            rowClassName={(row: SharedGroupsMatrixRow) =>
              row.project === UNSHARED_ROW ? 'unshared-row' : ''
            }
          >
            <Column
              field="project"
              header="Project"
              className="flexible-column"
              bodyClassName="value-cells"
              align="left"
              style={{ minWidth: '150px' }}
              frozen
              body={(row: SharedGroupsMatrixRow) => (
                <Box
                  component="span"
                  onClick={() => handleProjectClick(row.project)}
                  sx={{
                    cursor: 'pointer',
                    display: 'inline-block',
                    px: 1,
                    py: 0.5,
                    borderRadius: 16,
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                    '&:hover': {
                      backgroundColor:
                        row.project === UNSHARED_ROW
                          ? Theme.SecondaryMain100
                          : Theme.SecondaryMain50,
                    },
                  }}
                >
                  {row.project}
                </Box>
              )}
            />
            {columns.map(({ field, header }) => (
              <Column
                key={field}
                field={field}
                header={() => (
                  <Box
                    component="span"
                    className={
                      field !== UNKNOWN_VALUE_LABEL
                        ? combineClasses(columnStyleRules[categoryField])
                        : undefined
                    }
                  >
                    {header}
                  </Box>
                )}
                className="flexible-column"
                bodyClassName="value-cells"
                bodyStyle={
                  field === UNKNOWN_VALUE_LABEL
                    ? { backgroundColor: Theme.PrimaryGrey100 }
                    : undefined
                }
                headerStyle={
                  field === UNKNOWN_VALUE_LABEL
                    ? { backgroundColor: Theme.PrimaryGrey100 }
                    : undefined
                }
                body={(row: SharedGroupsMatrixRow) => (
                  <Box
                    component="span"
                    onClick={() => handleCellClick(row.project, field)}
                    sx={{
                      cursor: 'pointer',
                      display: 'inline-block',
                      px: 1,
                      py: 0.5,
                      borderRadius: 16,
                      transition: 'background-color 0.15s ease, color 0.15s ease',
                      '&:hover': {
                        backgroundColor:
                          field === UNKNOWN_VALUE_LABEL
                            ? Theme.SecondaryMain100
                            : Theme.SecondaryMain50,
                      },
                    }}
                  >
                    {row[field] as number}
                  </Box>
                )}
              />
            ))}
          </DataTable>
        </Box>
      )}
    </Box>
  );
}

export default MetadataCountsByProject;
