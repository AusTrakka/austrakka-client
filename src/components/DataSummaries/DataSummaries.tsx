import { InfoOutlined, RestartAlt, SwapHoriz, Tune } from '@mui/icons-material';
import {
  Badge,
  Box,
  Checkbox,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  Paper,
  Popover,
  Select,
  type SelectChangeEvent,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { DataTable, type DataTableFilterMetaData } from 'primereact/datatable';
import { Row } from 'primereact/row';
import { type ChangeEvent, useMemo, useState } from 'react';
import { selectOrgMetadata } from '../../app/orgMetadataSlice';
import { selectProjectMetadata } from '../../app/projectMetadataSlice';
import { type RootState, useAppSelector } from '../../app/store';
import { Theme } from '../../assets/themes/theme';
import FieldTypes from '../../constants/fieldTypes';
import { hasCompleteData } from '../../constants/metadataLoadingState';
import RecordTypes from '../../constants/record-type.enum';
import type { MetaDataColumn, ProjectViewField } from '../../types/dtos';
import SearchInput from '../TableComponents/SearchInput';
import {
  AGG_TYPE_LABELS,
  type AggregationType,
  type DateGranularity,
  FIELD_TYPE_AGGREGATION_TYPES,
  type FieldTypeMap,
  type GroupByBinSizeMap,
  type GroupByGranularityMap,
  type PivotConfig,
  type RowRecord,
  TableOrientation,
} from './dataSummariesMeta';
import { buildPivotGroups, computeSuggestedBinSize } from './dataSummariesUtils';
import PivotFieldConfig from './PivotFieldConfig';

// Enhancements:
// - Add data filters to the table
// - Support for aggregation/pivoting on Shared_groups field
// - Add export button to download CSV of the pivot table
// - Hide repeat row values for group-by fields (row grouping)
// - Convert the dropdowns to use autocomplete with checkboxes so that users can search for fields when there are many
// - Other aggregations - % of total, Top N with other group
// - Re-orderable display fields and group-by fields (drag and drop in popover maybe)

// TODO:
// - Fix up popover styling and test with different/dynamic screen sizes
// - Maybe the popover chips can be replaced with mini multiselect dropdowns for each field (at the moment theres a risk of the popover getting really wide)
// - Maybe it doesn't make sense for a display field to HAVE to be selected - maybe default call just be "Total records" aggregation, and all other breakdowns are added
// - Clean up all formatting/structure
// - Test with csv from a real project to see what it looks like

interface DataSummariesProps {
  identifier: string;
  recordType?: RecordTypes;
}

const INITIAL_PIVOT_CONFIG: PivotConfig = {
  groupByFields: [],
  displayFields: [],
  selectedAggregations: {},
  groupByGranularity: {},
  groupByBinSize: {},
};

const UNAVAILABLE_FIELDS = new Set<string>(['']);
const KNOWN_FIELD_TYPES = new Set<string>(Object.values(FieldTypes));

function fieldType(field: ProjectViewField | MetaDataColumn): FieldTypes {
  const raw = field.primitiveType ?? field.metaDataColumnTypeName;
  if (raw && KNOWN_FIELD_TYPES.has(raw)) {
    return raw as FieldTypes;
  }
  return FieldTypes.STRING;
}

function DataSummaries(props: DataSummariesProps) {
  const { identifier, recordType } = props;
  const [pivotConfig, setPivotConfig] = useState<PivotConfig>(INITIAL_PIVOT_CONFIG);
  const [orientation, setOrientation] = useState<TableOrientation>(
    TableOrientation.FieldsHorizontal,
  );
  const [aggPanelAnchor, setAggPanelAnchor] = useState<HTMLElement | null>(null);

  const metadataSelector = useMemo(
    () => (state: RootState) => {
      switch (recordType) {
        case RecordTypes.ORGANISATION:
          return selectOrgMetadata(state, identifier);
        case RecordTypes.PROJECT:
          return selectProjectMetadata(state, identifier);
        default:
          return null;
      }
    },
    [recordType, identifier],
  );

  const data = useAppSelector(metadataSelector);
  const loaded = hasCompleteData(data?.loadingState);
  const rawFields = data?.fields;

  const fields: ProjectViewField[] | MetaDataColumn[] = Array.isArray(rawFields) ? rawFields : [];

  const rawRows = data?.metadata;
  const rows: RowRecord[] = Array.isArray(rawRows) ? (rawRows as RowRecord[]) : [];

  const [filters, setFilters] = useState({
    global: { value: '', matchMode: FilterMatchMode.CONTAINS },
  });

  const fieldTypes: FieldTypeMap = useMemo(() => {
    const map: FieldTypeMap = {};
    for (const field of fields) {
      map[field.columnName] = fieldType(field);
    }
    return map;
  }, [fields]);

  const fieldLabelByKey: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    for (const field of fields) {
      map[field.columnName] = field.columnName;
    }
    return map;
  }, [fields]);

  const sortedFields = useMemo(
    () => [...fields].sort((a, b) => a.columnName.localeCompare(b.columnName)),
    [fields],
  );

  // Handlers
  function handleReset() {
    setPivotConfig(INITIAL_PIVOT_CONFIG);
    setBinSizeInputText({}); // Clear any in-progress typed text
    setOrientation(TableOrientation.FieldsHorizontal);
  }

  function handleGroupByChange(event: SelectChangeEvent<string[]>) {
    const { value } = event.target;
    const nextGroupByFields = typeof value === 'string' ? value.split(',') : value;

    setPivotConfig((prev) => {
      // Drop granularity entries for columns no longer grouped on
      const nextGranularity: GroupByGranularityMap = {};
      for (const col of nextGroupByFields) {
        if (prev.groupByGranularity[col]) {
          nextGranularity[col] = prev.groupByGranularity[col];
        }
      }

      const nextBinSize: GroupByBinSizeMap = {};

      for (const col of nextGroupByFields) {
        if (prev.groupByBinSize[col] !== undefined) {
          nextBinSize[col] = prev.groupByBinSize[col];
        }
      }

      return {
        ...prev,
        groupByFields: nextGroupByFields,
        groupByGranularity: nextGranularity,
        groupByBinSize: nextBinSize,
      };
    });
  }

  function handleDisplayFieldsChange(event: SelectChangeEvent<string[]>) {
    const { value } = event.target;
    const nextDisplayFields = typeof value === 'string' ? value.split(',') : value;

    setPivotConfig((prev) => {
      const nextSelectedAggregations: Record<string, AggregationType[]> = {};
      for (const col of nextDisplayFields) {
        const allowed = FIELD_TYPE_AGGREGATION_TYPES[fieldTypes[col]] ?? [];
        // Keep existing selection if present (filtered to still-valid types),
        // otherwise default to whatever was already chosen for this column.
        nextSelectedAggregations[col] =
          prev.selectedAggregations[col]?.filter((agg) => allowed.includes(agg)) ??
          allowed.slice(0, 1); // sensible default: first allowed aggregation
      }

      return {
        ...prev,
        displayFields: nextDisplayFields,
        selectedAggregations: nextSelectedAggregations,
      };
    });
  }

  function toggleAggregation(col: string, agg: AggregationType) {
    setPivotConfig((prev) => {
      const current = prev.selectedAggregations[col] ?? [];
      const next = current.includes(agg) ? current.filter((a) => a !== agg) : [...current, agg];

      return {
        ...prev,
        selectedAggregations: {
          ...prev.selectedAggregations,
          [col]: next,
        },
      };
    });
  }

  function setGroupByGranularity(col: string, granularity: DateGranularity) {
    setPivotConfig((prev) => ({
      ...prev,
      groupByGranularity: {
        ...prev.groupByGranularity,
        [col]: granularity,
      },
    }));
  }

  function setBinningEnabled(col: string, enabled: boolean) {
    setBinSizeInputText((prev) => {
      const next = { ...prev };
      delete next[col];
      return next;
    });
    setPivotConfig((prev) => {
      const nextBinSize = { ...prev.groupByBinSize };
      if (enabled) {
        nextBinSize[col] = computeSuggestedBinSize(rows, col);
      } else {
        delete nextBinSize[col];
      }
      return { ...prev, groupByBinSize: nextBinSize };
    });
  }

  const [binSizeInputText, setBinSizeInputText] = useState<Record<string, string>>({});

  function handleBinSizeInputChange(col: string, rawValue: string) {
    setBinSizeInputText((prev) => ({ ...prev, [col]: rawValue }));

    if (rawValue === '') {
      return;
    }

    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return;
    }

    setPivotConfig((prev) => ({
      ...prev,
      groupByBinSize: { ...prev.groupByBinSize, [col]: parsed },
    }));
  }

  function handleRemoveGroupByField(col: string) {
    setBinSizeInputText((prev) => {
      const next = { ...prev };
      delete next[col];
      return next;
    });
    setPivotConfig((prev) => {
      const nextGroupByFields = prev.groupByFields.filter((f) => f !== col);
      const nextGranularity = { ...prev.groupByGranularity };
      delete nextGranularity[col];
      const nextBinSize = { ...prev.groupByBinSize };
      delete nextBinSize[col];
      return {
        ...prev,
        groupByFields: nextGroupByFields,
        groupByGranularity: nextGranularity,
        groupByBinSize: nextBinSize,
      };
    });
  }

  function handleRemoveDisplayField(col: string) {
    setPivotConfig((prev) => {
      const nextDisplayFields = prev.displayFields.filter((f) => f !== col);
      const nextSelectedAggregations = { ...prev.selectedAggregations };
      delete nextSelectedAggregations[col];
      return {
        ...prev,
        displayFields: nextDisplayFields,
        selectedAggregations: nextSelectedAggregations,
      };
    });
  }

  // Clear the input text when the user leaves the field, so that it will revert to the actual value in the pivotConfig if they didn't enter a valid number
  function handleBinSizeBlur(col: string) {
    setBinSizeInputText((prev) => {
      const next = { ...prev };
      delete next[col];
      return next;
    });
  }

  // Compute pivot
  const pivotGroups = useMemo(
    () =>
      buildPivotGroups(
        rows,
        pivotConfig.groupByFields,
        pivotConfig.displayFields,
        fieldTypes,
        pivotConfig.selectedAggregations,
        pivotConfig.groupByGranularity as GroupByGranularityMap,
        pivotConfig.groupByBinSize as GroupByBinSizeMap,
      ),
    [rows, pivotConfig, fieldTypes],
  );

  const horizontalTableRows = useMemo(
    () =>
      pivotGroups.map((group) => {
        const row: Record<string, unknown> = { ...group.groupValues, __rowCount: group.rowCount };
        for (const col of pivotConfig.displayFields) {
          const aggsForCol = pivotConfig.selectedAggregations[col] ?? [];
          for (const agg of aggsForCol) {
            row[`${col}__${agg}`] = group.counts[col]?.[agg] ?? '—';
          }
        }
        return row;
      }),
    [pivotGroups, pivotConfig.displayFields, pivotConfig.selectedAggregations],
  );

  const verticalAggregationColumns = useMemo(() => {
    const used = new Set<AggregationType>();
    for (const col of pivotConfig.displayFields) {
      for (const agg of pivotConfig.selectedAggregations[col] ?? []) {
        used.add(agg);
      }
    }
    return (Object.keys(AGG_TYPE_LABELS) as AggregationType[]).filter((agg) => used.has(agg));
  }, [pivotConfig.displayFields, pivotConfig.selectedAggregations]);

  const verticalTableRows = useMemo(() => {
    const out: Record<string, unknown>[] = [];
    for (const col of pivotConfig.displayFields) {
      const aggsForCol = new Set(pivotConfig.selectedAggregations[col] ?? []);
      for (const group of pivotGroups) {
        const row: Record<string, unknown> = {
          field: fieldLabelByKey[col] ?? col,
          ...group.groupValues,
          __rowCount: group.rowCount,
        };
        for (const agg of verticalAggregationColumns) {
          row[agg] = aggsForCol.has(agg) ? (group.counts[col]?.[agg] ?? '—') : '';
        }
        out.push(row);
      }
    }
    return out;
  }, [
    pivotGroups,
    pivotConfig.displayFields,
    pivotConfig.selectedAggregations,
    fieldLabelByKey,
    verticalAggregationColumns,
  ]);

  function onGlobalFilterChange(event: ChangeEvent<HTMLInputElement>) {
    const { value } = event.target;
    const nextFilters = { ...filters };
    (nextFilters.global as DataTableFilterMetaData).value = value;
    setFilters(nextFilters);
  }

  // globalFilterFields must be supplied explicitly since our columns are
  // generated dynamically rather than being a fixed, known set — one list
  // per orientation since the two layouts use different field keys.
  const horizontalGlobalFilterFields = useMemo(() => {
    const fields: string[] = [...pivotConfig.groupByFields];
    for (const col of pivotConfig.displayFields) {
      for (const agg of pivotConfig.selectedAggregations[col] ?? []) {
        fields.push(`${col}__${agg}`);
      }
    }
    return fields;
  }, [pivotConfig.groupByFields, pivotConfig.displayFields, pivotConfig.selectedAggregations]);

  const verticalGlobalFilterFields = useMemo(
    () => ['field', ...pivotConfig.groupByFields, ...verticalAggregationColumns],
    [pivotConfig.groupByFields, verticalAggregationColumns],
  );

  // Display conditionals
  const hasAnyAggregationSelected = Object.values(pivotConfig.selectedAggregations).some(
    (aggregations) => aggregations.length > 0,
  );
  const showEmptyState = pivotConfig.displayFields.length === 0 || !hasAnyAggregationSelected;
  const shouldShowTable = !showEmptyState;
  const emptyStateMessage = (
    <Typography variant="body2" component="div" sx={{ p: 2 }} color={Theme.PrimaryGrey600}>
      Choose at least one field to display aggregations for
    </Typography>
  );

  const tableHeaderControls = (
    <div
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}
    >
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
        <SearchInput
          value={(filters.global as DataTableFilterMetaData).value || ''}
          onChange={onGlobalFilterChange}
        />
        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl
            sx={{
              width: 220,
            }}
            size="small"
          >
            <InputLabel id="display-fields-label">Display fields</InputLabel>
            <Select
              labelId="display-fields-label"
              multiple
              value={pivotConfig.displayFields}
              onChange={handleDisplayFieldsChange}
              label="Display fields"
              renderValue={(selected) =>
                selected.map((col) => fieldLabelByKey[col] ?? col).join(', ')
              }
            >
              {sortedFields.length === 0 ? (
                <MenuItem disabled>
                  <ListItemText primary="No fields available" />
                </MenuItem>
              ) : (
                sortedFields.map((field) => {
                  const key = field.columnName;
                  const isUnavailable = UNAVAILABLE_FIELDS.has(key);
                  return (
                    <MenuItem key={key} value={key} disabled={isUnavailable}>
                      <Checkbox checked={pivotConfig.displayFields.includes(key)} />
                      <ListItemText primary={field.columnName} />
                      {isUnavailable && (
                        <Tooltip
                          title="This field is currently unavailable for summary generation"
                          arrow
                        >
                          <Box
                            component="span"
                            sx={{ pointerEvents: 'auto', display: 'flex', ml: 1 }}
                          >
                            <InfoOutlined fontSize="small" />
                          </Box>
                        </Tooltip>
                      )}
                    </MenuItem>
                  );
                })
              )}
            </Select>
          </FormControl>
          <FormControl
            sx={{
              width: 220,
            }}
            size="small"
          >
            <InputLabel id="group-by-label">Group-by fields</InputLabel>
            <Select
              labelId="group-by-label"
              multiple
              value={pivotConfig.groupByFields}
              onChange={handleGroupByChange}
              label="Group-by fields"
              renderValue={(selected) =>
                selected.map((col) => fieldLabelByKey[col] ?? col).join(', ')
              }
            >
              {sortedFields.length === 0 ? (
                <MenuItem disabled>
                  <ListItemText primary="No fields available" />
                </MenuItem>
              ) : (
                sortedFields.map((field) => {
                  const key = field.columnName;
                  const isUnavailable = UNAVAILABLE_FIELDS.has(key);
                  return (
                    <MenuItem key={key} value={key} disabled={isUnavailable}>
                      <Checkbox checked={pivotConfig.groupByFields.includes(key)} />
                      <ListItemText primary={field.columnName} />
                      {isUnavailable && (
                        <Tooltip
                          title="This field is currently unavailable for summary generation"
                          arrow
                        >
                          <Box
                            component="span"
                            sx={{ pointerEvents: 'auto', display: 'flex', ml: 1 }}
                          >
                            <InfoOutlined fontSize="small" />
                          </Box>
                        </Tooltip>
                      )}
                    </MenuItem>
                  );
                })
              )}
            </Select>
          </FormControl>

          <Tooltip title="Configure aggregations" arrow>
            <IconButton size="small" onClick={(event) => setAggPanelAnchor(event.currentTarget)}>
              <Badge
                badgeContent={pivotConfig.displayFields.length + pivotConfig.groupByFields.length}
                sx={{
                  color: 'white',
                  top: -12,
                  right: -22,
                  '& .MuiBadge-badge': { backgroundColor: Theme.PrimaryMain },
                }}
              />
              <Tune fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Switch table orientation" arrow>
            <IconButton
              size="small"
              disabled={showEmptyState}
              onClick={() =>
                setOrientation((prev) =>
                  prev === TableOrientation.FieldsHorizontal
                    ? TableOrientation.FieldsVertical
                    : TableOrientation.FieldsHorizontal,
                )
              }
            >
              <SwapHoriz fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset table configuration" arrow>
            <IconButton size="small" onClick={handleReset} color="error" disabled={showEmptyState}>
              <RestartAlt fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </div>
  );

  if (!loaded) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          p: 4,
          gap: 1,
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <CircularProgress size={24} />
        Loading metadata...
      </Box>
    );
  }

  return (
    <Box>
      <Popover
        open={Boolean(aggPanelAnchor)}
        anchorEl={aggPanelAnchor}
        onClose={() => setAggPanelAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <PivotFieldConfig
          pivotConfig={pivotConfig}
          fieldTypes={fieldTypes}
          fieldLabelByKey={fieldLabelByKey}
          binSizeInputText={binSizeInputText}
          onRemoveGroupByField={handleRemoveGroupByField}
          onRemoveDisplayField={handleRemoveDisplayField}
          onSetGroupByGranularity={setGroupByGranularity}
          onSetBinningEnabled={setBinningEnabled}
          onBinSizeInputChange={handleBinSizeInputChange}
          onBinSizeBlur={handleBinSizeBlur}
          onToggleAggregation={toggleAggregation}
        />
      </Popover>

      {orientation === TableOrientation.FieldsHorizontal && (
        <Paper variant="outlined">
          <DataTable
            value={shouldShowTable ? horizontalTableRows : []}
            size="small"
            className="my-flexible-table"
            scrollable
            emptyMessage={emptyStateMessage}
            header={tableHeaderControls}
            filters={filters}
            globalFilterFields={horizontalGlobalFilterFields}
            headerColumnGroup={
              <ColumnGroup>
                <Row>
                  {pivotConfig.groupByFields.map((col) => (
                    <Column
                      key={col}
                      header={fieldLabelByKey[col] ?? col}
                      rowSpan={2}
                      className="flexible-column"
                      bodyClassName="value-cells"
                    />
                  ))}
                  {pivotConfig.displayFields.map((col) => {
                    const aggsForCol = pivotConfig.selectedAggregations[col] ?? [];
                    if (aggsForCol.length === 0) return null;
                    return (
                      <Column
                        key={col}
                        header={fieldLabelByKey[col] ?? col}
                        colSpan={aggsForCol.length}
                        className="flexible-column"
                        bodyClassName="value-cells"
                      />
                    );
                  })}
                </Row>
                <Row>
                  {pivotConfig.displayFields.flatMap((col) =>
                    (pivotConfig.selectedAggregations[col] ?? []).map((agg) => (
                      <Column
                        key={`${col}__${agg}`}
                        header={AGG_TYPE_LABELS[agg]}
                        className="flexible-column"
                        bodyClassName="value-cells"
                      />
                    )),
                  )}
                </Row>
              </ColumnGroup>
            }
          >
            {pivotConfig.groupByFields.map((col) => (
              <Column
                key={col}
                field={col}
                className="flexible-column"
                bodyClassName="value-cells"
              />
            ))}
            {pivotConfig.displayFields.map((col) =>
              (pivotConfig.selectedAggregations[col] ?? []).map((agg) => (
                <Column
                  key={`${col}__${agg}`}
                  field={`${col}__${agg}`}
                  className="flexible-column"
                  bodyClassName="value-cells"
                />
              )),
            )}
          </DataTable>
        </Paper>
      )}

      {orientation === TableOrientation.FieldsVertical && (
        <Paper variant="outlined">
          <DataTable
            value={shouldShowTable ? verticalTableRows : []}
            size="small"
            emptyMessage={emptyStateMessage}
            scrollable
            header={tableHeaderControls}
            filters={filters}
            globalFilterFields={verticalGlobalFilterFields}
            rowGroupMode="rowspan"
            groupRowsBy="field"
            className="my-flexible-table"
          >
            <Column
              field="field"
              header="Field"
              className="flexible-column"
              bodyClassName="value-cells"
            />
            {pivotConfig.groupByFields.map((col) => (
              <Column
                key={col}
                field={col}
                header={fieldLabelByKey[col] ?? col}
                className="flexible-column"
                bodyClassName="value-cells"
              />
            ))}
            {verticalAggregationColumns.map((agg) => (
              <Column
                key={agg}
                field={agg}
                header={AGG_TYPE_LABELS[agg]}
                className="flexible-column"
                bodyClassName="value-cells"
              />
            ))}
          </DataTable>
        </Paper>
      )}
    </Box>
  );
}

export default DataSummaries;
