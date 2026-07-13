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
const UNSHARED_COLUMN = 'Unshared';

interface MetadataCountsByProjectProps {
  widgetType: WidgetType;
  identifier: string;
  title?: string;
  categoryField: string;
  filteredData: Sample[];
}

interface SharedGroupsMatrixRow {
  category: string;
  [projectName: string]: string | number;
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
): { rows: SharedGroupsMatrixRow[]; projectColumns: PrimeReactColumnDefinition[] } {
  const matrix = new Map<string, Map<string, number>>();
  const allProjects = new Set<string>();
  let hasUnshared = false;

  for (const sample of data) {
    const projects = getSharedProjectNames(
      sample[SHARED_GROUPS_FIELD as keyof Sample] as string | undefined,
    );

    const rawCategory = (sample[categoryField as keyof Sample] as string) ?? '';
    const strippedCategory =
      categoryField === 'Owner_group' ? stripOwnerSuffix(rawCategory) : rawCategory;
    const category = strippedCategory === '' ? UNKNOWN_VALUE_LABEL : strippedCategory;

    if (!matrix.has(category)) matrix.set(category, new Map());
    const projectCounts = matrix.get(category)!;

    if (projects.length === 0) {
      hasUnshared = true;
      projectCounts.set(UNSHARED_COLUMN, (projectCounts.get(UNSHARED_COLUMN) ?? 0) + 1);
      continue;
    }

    projects.forEach((project) => {
      allProjects.add(project);
      projectCounts.set(project, (projectCounts.get(project) ?? 0) + 1);
    });
  }

  const projectColumns: PrimeReactColumnDefinition[] = [...allProjects]
    .sort()
    .map((project) => ({ field: project, header: project }));

  if (hasUnshared) {
    projectColumns.push({ field: UNSHARED_COLUMN, header: UNSHARED_COLUMN });
  }

  const rows: SharedGroupsMatrixRow[] = [...matrix.entries()]
    .map(([category, projectCounts]) => {
      const row: SharedGroupsMatrixRow = { category, Total: 0 };
      let total = 0;
      projectColumns.forEach(({ field }) => {
        const count = projectCounts.get(field) ?? 0;
        row[field] = count;
        total += count;
      });
      row.Total = total;
      return row;
    })
    .sort((a, b) => {
      const aIsUnknown = a.category === UNKNOWN_VALUE_LABEL;
      const bIsUnknown = b.category === UNKNOWN_VALUE_LABEL;

      if (aIsUnknown && !bIsUnknown) return 1;
      if (!aIsUnknown && bIsUnknown) return -1;

      return b.Total - a.Total; // Sort rows by total count descending
    });

  return { rows, projectColumns };
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
      const { rows, projectColumns } = buildSharedGroupsMatrix(
        data.metadata as Sample[],
        categoryField,
      );
      setRows(rows);
      setColumns(projectColumns);
    }
  }, [data?.metadata, data?.fields, data?.loadingState, categoryField, errorMessage]);

  // Metadata value drilldown
  const handleCategoryClick = (categoryValue: string) => {
    const unknownFlag = categoryValue === UNKNOWN_VALUE_LABEL;

    const filters: DataTableFilterMeta = {
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

  // Combined metadata value and project drilldown
  const handleCellClick = (project: string, categoryValue: string) => {
    const unsharedFlag = project === UNSHARED_COLUMN;
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
        <Box flex={1} minHeight={0}>
          <DataTable
            value={rows}
            size="small"
            scrollable
            scrollHeight="flex"
            className="my-flexible-table"
          >
            <Column
              field="category"
              header={categoryField}
              align="left"
              frozen
              body={(row: SharedGroupsMatrixRow) => (
                <Box
                  component="span"
                  className={
                    row.category !== UNKNOWN_VALUE_LABEL
                      ? combineClasses(columnStyleRules[categoryField])
                      : undefined
                  }
                  onClick={() => handleCategoryClick(row.category)}
                  sx={{
                    cursor: 'pointer',
                    display: 'inline-block',
                    px: 1,
                    py: 0.5,
                    borderRadius: 16,
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                    '&:hover': {
                      backgroundColor: Theme.SecondaryMain50,
                    },
                  }}
                >
                  {row.category}
                </Box>
              )}
            />
            {columns.map(({ field, header }) => (
              <Column
                key={field}
                field={field}
                header={header}
                bodyStyle={
                  field === UNSHARED_COLUMN ? { backgroundColor: Theme.PrimaryGrey100 } : undefined
                }
                headerStyle={
                  field === UNSHARED_COLUMN ? { backgroundColor: Theme.PrimaryGrey100 } : undefined
                }
                body={(row: SharedGroupsMatrixRow) => (
                  <Box
                    component="span"
                    className={
                      row.category !== UNKNOWN_VALUE_LABEL
                        ? combineClasses(columnStyleRules[categoryField])
                        : undefined
                    }
                    onClick={() => handleCellClick(header, row.category)}
                    sx={{
                      cursor: 'pointer',
                      display: 'inline-block',
                      px: 1,
                      py: 0.5,
                      borderRadius: 16,
                      transition: 'background-color 0.15s ease, color 0.15s ease',
                      '&:hover': {
                        backgroundColor:
                          field === UNSHARED_COLUMN
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
