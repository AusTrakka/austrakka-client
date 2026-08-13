import { RestartAlt, SwapHoriz, Tune } from '@mui/icons-material';
import {
  Badge,
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { DataTable, type DataTableFilterMetaData } from 'primereact/datatable';
import { Row } from 'primereact/row';
import { type ChangeEvent, useMemo, useRef, useState } from 'react';
import type { OrgMetadataState } from '../../app/orgMetadataSlice';
import type { ProjectMetadataState } from '../../app/projectMetadataSlice';
import { Theme } from '../../assets/themes/theme';
import FieldTypes from '../../constants/fieldTypes';
import { hasCompleteData } from '../../constants/metadataLoadingState';
import type { MetaDataColumn, ProjectViewField } from '../../types/dtos';
import type { Sample } from '../../types/sample.interface';
import CustomDrawer from '../Common/CustomDrawer';
import ExportTableData from '../Common/ExportTableData';
import type { TableType } from '../ProjectOverview/ProjectSamplesTable';
import SearchInput from '../TableComponents/SearchInput';
import {
  AGG_TYPE_LABELS,
  type AggregationType,
  type DateGranularity,
  FIELD_TYPE_AGGREGATION_TYPES,
  type FieldTypeMap,
  type GroupByBinSizeMap,
  type GroupByGranularityMap,
  type GroupByTopNMap,
  type PivotConfig,
  RECORD_COUNT_FALLBACK_KEY,
  type RowRecord,
  SUMMABLE_AGGREGATION_TYPES,
  TableOrientation,
  TOTAL_FIELD,
} from './dataSummariesMeta';
import { buildPivotGroups, computeSuggestedBinSize } from './dataSummariesUtils';
import PivotFieldConfig from './PivotFieldConfig';
import ViewSummariesToggle from './ViewSummariesToggle';

// Possible enhancements:
// - Support for aggregation/pivoting on Shared_groups field (and other multi-value fields)
// - Consider adding the ability for matrix-style pivoting (2 dimensions of grouping rather than just a single group-by dimension)
// - Could expand the per-field config to allow user to update formatting options (e.g. number of decimal places, date format, etc.)

// TODO:
// - Add display table to URL - will we need to add the pivot table config to the URL too then maybe?

interface DataSummariesProps {
  data: OrgMetadataState | ProjectMetadataState | null;
  metadata: Sample[];
  activeTable: TableType;
  setActiveTable: (table: TableType) => void;
}

const INITIAL_PIVOT_CONFIG: PivotConfig = {
  groupByFields: [],
  displayFields: [],
  selectedAggregations: {},
  groupByGranularity: {},
  groupByBinSize: {},
  showTotalCountFooter: true,
  showRelativePercentages: false,
  hideEmptyNullGroups: false,
  groupByTopNSize: {},
  groupByTopNGlobal: {},
};

const KNOWN_FIELD_TYPES = new Set<string>(Object.values(FieldTypes));

function fieldType(field: ProjectViewField | MetaDataColumn): FieldTypes {
  const raw = field.primitiveType ?? field.metaDataColumnTypeName;
  if (raw && KNOWN_FIELD_TYPES.has(raw)) {
    return raw as FieldTypes;
  }
  return FieldTypes.STRING;
}

function renderCell(value: unknown, pct: unknown, showPercentage: boolean) {
  if (value === null || value === undefined || value === '' || value === '—') {
    return '—';
  }

  if (!showPercentage || typeof pct !== 'number') {
    return String(value);
  }

  return (
    <Stack direction="row" spacing={0.75} alignItems="baseline" display="inline-flex">
      <span>{value as React.ReactNode}</span>
      <Typography
        component="span"
        variant="caption"
        sx={{ color: 'text.secondary', fontWeight: 400 }}
      >
        ({pct}%)
      </Typography>
    </Stack>
  );
}

function DataSummaries(props: DataSummariesProps) {
  const { data, metadata, activeTable, setActiveTable } = props;

  const [pivotConfig, setPivotConfig] = useState<PivotConfig>(INITIAL_PIVOT_CONFIG);
  const [orientation, setOrientation] = useState<TableOrientation>(
    TableOrientation.FieldsHorizontal,
  );
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);
  const horizontalTableRef = useRef<DataTable<Record<string, unknown>[]>>(null);
  const verticalTableRef = useRef<DataTable<Record<string, unknown>[]>>(null);
  const loaded = hasCompleteData(data?.loadingState);
  const rawFields = data?.fields;
  const fields: ProjectViewField[] | MetaDataColumn[] = Array.isArray(rawFields) ? rawFields : [];

  const rows: RowRecord[] = Array.isArray(metadata) ? (metadata as RowRecord[]) : [];

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

  function handleGroupByChange(nextGroupByFields: string[]) {
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

      const nextTopN: GroupByTopNMap = {};
      for (const col of nextGroupByFields) {
        if (prev.groupByTopNSize[col] !== undefined) {
          nextTopN[col] = prev.groupByTopNSize[col];
        }
      }

      const nextTopNGlobal: Record<string, boolean> = {};
      for (const col of nextGroupByFields) {
        if (prev.groupByTopNGlobal[col] !== undefined) {
          nextTopNGlobal[col] = prev.groupByTopNGlobal[col];
        }
      }

      // If reordering just moved a field into first position while it was set to per-group,
      // Ensure it switches back to global rather than leaving an invalid state
      const [firstField] = nextGroupByFields;
      if (firstField !== undefined && nextTopNGlobal[firstField] === false) {
        nextTopNGlobal[firstField] = true;
      }

      return {
        ...prev,
        groupByFields: nextGroupByFields,
        groupByGranularity: nextGranularity,
        groupByBinSize: nextBinSize,
        groupByTopNSize: nextTopN,
        groupByTopNGlobal: nextTopNGlobal,
      };
    });
  }

  function handleDisplayFieldsChange(nextDisplayFields: string[]) {
    setPivotConfig((prev) => {
      const nextSelectedAggregations: Record<string, AggregationType[]> = {};
      for (const col of nextDisplayFields) {
        const allowed = FIELD_TYPE_AGGREGATION_TYPES[fieldTypes[col]] ?? [];
        nextSelectedAggregations[col] =
          prev.selectedAggregations[col]?.filter((agg) => allowed.includes(agg)) ??
          allowed.slice(0, 1);
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

  function setGroupByTopNEnabled(col: string, enabled: boolean) {
    setPivotConfig((prev) => {
      const nextTopN = { ...prev.groupByTopNSize };
      const nextTopNGlobal = { ...prev.groupByTopNGlobal };
      if (enabled) {
        // Default top N value
        nextTopN[col] = topNInputText[col] !== undefined ? Number(topNInputText[col]) : 5;
        // Set default to global if not already set
        if (prev.groupByTopNGlobal[col] === undefined) {
          nextTopNGlobal[col] = true;
        }
      } else {
        delete nextTopN[col];
        delete nextTopNGlobal[col];
      }
      return { ...prev, groupByTopNSize: nextTopN, groupByTopNGlobal: nextTopNGlobal };
    });
  }
  const [topNInputText, setTopNInputText] = useState<Record<string, string>>({});

  function handleGroupByTopNInputChange(col: string, rawValue: string) {
    setTopNInputText((prev) => ({ ...prev, [col]: rawValue }));

    if (rawValue === '') {
      return;
    }

    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return;
    }

    setPivotConfig((prev) => ({
      ...prev,
      groupByTopNSize: { ...prev.groupByTopNSize, [col]: parsed },
    }));
  }

  function handleSetGroupByTopNGlobal(col: string, isGlobal: boolean) {
    setPivotConfig((prev) => {
      const nextTopNGlobal = { ...prev.groupByTopNGlobal };
      nextTopNGlobal[col] = isGlobal;
      return { ...prev, groupByTopNGlobal: nextTopNGlobal };
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
    setTopNInputText((prev) => {
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
      const nextTopN = { ...prev.groupByTopNSize };
      delete nextTopN[col];
      const nextTopNGlobal = { ...prev.groupByTopNGlobal };
      delete nextTopNGlobal[col];

      return {
        ...prev,
        groupByFields: nextGroupByFields,
        groupByGranularity: nextGranularity,
        groupByBinSize: nextBinSize,
        groupByTopNSize: nextTopN,
        groupByTopNGlobal: nextTopNGlobal,
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

  // Clear the input text when the user leaves the field, so that it will revert to the actual value in the pivotConfig if they didn't enter a valid number
  function handleTopNBlur(col: string) {
    setTopNInputText((prev) => {
      const next = { ...prev };
      delete next[col];
      return next;
    });
  }

  function handleShowTotalCountFooterChange(show: boolean) {
    setPivotConfig((prev) => ({
      ...prev,
      showTotalCountFooter: show,
    }));
  }

  function onShowRelativePercentagesChange(show: boolean) {
    setPivotConfig((prev) => ({
      ...prev,
      showRelativePercentages: show,
    }));
  }

  function onHideEmptyNullGroupsChange(hide: boolean) {
    setPivotConfig((prev) => ({
      ...prev,
      hideEmptyNullGroups: hide,
    }));
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
        pivotConfig.groupByTopNSize as GroupByTopNMap,
        pivotConfig.groupByTopNGlobal as Record<string, boolean>,
        {
          showRelativePercentages: pivotConfig.showRelativePercentages,
          hideEmptyNullGroups: pivotConfig.hideEmptyNullGroups,
        },
      ),
    [rows, pivotConfig, fieldTypes],
  );

  const horizontalTableRows = useMemo(
    () =>
      pivotGroups.map((group) => {
        const row: Record<string, unknown> = {
          ...group.groupValues,
          [TOTAL_FIELD]: group.rowCount,
          [`${TOTAL_FIELD}__pct`]: group.rowCountPercentage,
        };
        for (const col of pivotConfig.displayFields) {
          const aggsForCol = pivotConfig.selectedAggregations[col] ?? [];
          for (const agg of aggsForCol) {
            const key = `${col}__${agg}`;
            row[key] = group.counts[col]?.[agg] ?? null;
            row[`${key}__pct`] = group.percentages?.[col]?.[agg] ?? null;
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

    // Fallback field list if displayFields is empty
    // Simply splitting all records by the group by fields and showing the total record count for each group
    const fieldsToRender =
      pivotConfig.displayFields.length > 0
        ? pivotConfig.displayFields
        : [RECORD_COUNT_FALLBACK_KEY];

    for (const col of fieldsToRender) {
      const isFallback = col === RECORD_COUNT_FALLBACK_KEY;
      const aggsForCol = new Set(pivotConfig.selectedAggregations[col] ?? []);
      for (const group of pivotGroups) {
        const row: Record<string, unknown> = {
          field: isFallback ? '-' : (fieldLabelByKey[col] ?? col),
          ...group.groupValues,
          [TOTAL_FIELD]: group.rowCount,
          [`${TOTAL_FIELD}__pct`]: group.rowCountPercentage,
        };
        for (const agg of verticalAggregationColumns) {
          if (aggsForCol.has(agg)) {
            row[agg] = group.counts[col]?.[agg] ?? null;
            row[`${agg}__pct`] = group.percentages?.[col]?.[agg] ?? null;
          } else {
            row[agg] = '';
          }
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
    const fields: string[] = [TOTAL_FIELD, ...pivotConfig.groupByFields];
    for (const col of pivotConfig.displayFields) {
      for (const agg of pivotConfig.selectedAggregations[col] ?? []) {
        fields.push(`${col}__${agg}`);
      }
    }
    return fields;
  }, [pivotConfig.groupByFields, pivotConfig.displayFields, pivotConfig.selectedAggregations]);

  const verticalGlobalFilterFields = useMemo(
    () => ['field', ...pivotConfig.groupByFields, TOTAL_FIELD, ...verticalAggregationColumns],
    [pivotConfig.groupByFields, verticalAggregationColumns],
  );

  // Display conditionals
  const showEmptyState = rows.length === 0;
  const shouldShowTable = !showEmptyState;
  const emptyStateMessage = (
    <Typography variant="body2" component="div" sx={{ p: 2 }} color={Theme.PrimaryGrey600}>
      No data available
    </Typography>
  );

  // Compute totals summary rows
  const grandTotalRecords = useMemo(
    () => pivotGroups.reduce((accumulatedCount, group) => accumulatedCount + group.rowCount, 0),
    [pivotGroups],
  );

  const verticalColumnTotals = useMemo(() => {
    if (!shouldShowTable || verticalTableRows.length === 0) return {};

    const totals: Record<string, number | string> = {};

    totals[TOTAL_FIELD] = grandTotalRecords;

    // Sum up numeric values in aggregation columns
    for (const verticalAgg of verticalAggregationColumns) {
      if (!SUMMABLE_AGGREGATION_TYPES.has(verticalAgg)) continue;

      totals[verticalAgg] = verticalTableRows.reduce((accumulatedCount, row) => {
        const val = Number(row[verticalAgg]);
        return accumulatedCount + (Number.isFinite(val) ? val : 0);
      }, 0);
    }

    return totals;
  }, [shouldShowTable, verticalTableRows, verticalAggregationColumns, grandTotalRecords]);

  const horizontalColumnTotals = useMemo(() => {
    if (!shouldShowTable || horizontalTableRows.length === 0) return {};

    const totals: Record<string, number> = {};

    // Total records count
    totals[TOTAL_FIELD] = horizontalTableRows.reduce(
      (accumulatedCount, row) => accumulatedCount + (Number(row[TOTAL_FIELD]) || 0),
      0,
    );

    // Sum up totals for each display field and aggregation type combination
    for (const col of pivotConfig.displayFields) {
      const aggsForCol = pivotConfig.selectedAggregations[col] ?? [];
      for (const agg of aggsForCol) {
        if (!SUMMABLE_AGGREGATION_TYPES.has(agg)) continue;

        const key = `${col}__${agg}`;
        totals[key] = horizontalTableRows.reduce((accumulatedCount, row) => {
          const val = Number(row[key]);
          return accumulatedCount + (Number.isFinite(val) ? val : 0);
        }, 0);
      }
    }

    return totals;
  }, [
    shouldShowTable,
    horizontalTableRows,
    pivotConfig.displayFields,
    pivotConfig.selectedAggregations,
  ]);

  const horizontalExportHeaders = useMemo(() => {
    const headers = [...pivotConfig.groupByFields, TOTAL_FIELD];
    for (const col of pivotConfig.displayFields) {
      for (const agg of pivotConfig.selectedAggregations[col] ?? []) {
        headers.push(`${col}__${agg}`);
      }
    }
    return headers;
  }, [pivotConfig.groupByFields, pivotConfig.displayFields, pivotConfig.selectedAggregations]);

  const verticalExportHeaders = useMemo(
    () => ['field', ...pivotConfig.groupByFields, TOTAL_FIELD, ...verticalAggregationColumns],
    [pivotConfig.groupByFields, verticalAggregationColumns],
  );

  const activeExportRows = useMemo(() => {
    const baseRows =
      orientation === TableOrientation.FieldsHorizontal ? horizontalTableRows : verticalTableRows;

    if (!pivotConfig.showTotalCountFooter) {
      return baseRows;
    }

    const isHorizontal = orientation === TableOrientation.FieldsHorizontal;
    const totals = isHorizontal ? horizontalColumnTotals : verticalColumnTotals;
    const headers = isHorizontal ? horizontalExportHeaders : verticalExportHeaders;

    // Build a totals row with every header present
    const totalsRow: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      if (header === TOTAL_FIELD) {
        // Header is the total records column
        totalsRow[header] = totals[TOTAL_FIELD] ?? 0;
      } else if (header in totals) {
        // Header is a display field + aggregation combination
        totalsRow[header] = totals[header];
      } else if (header === 'field') {
        // Header is the "field" column in vertical orientation - show "Total" in the first column of the totals row
        totalsRow[header] = 'Total';
      } else if (index === 0) {
        // Header is the first column in horizontal orientation - show "Total" in the first column of the totals row
        totalsRow[header] = 'Total';
      } else {
        totalsRow[header] = '';
      }
    });

    return [...baseRows, totalsRow];
  }, [
    orientation,
    horizontalTableRows,
    verticalTableRows,
    pivotConfig.showTotalCountFooter,
    horizontalColumnTotals,
    verticalColumnTotals,
    horizontalExportHeaders,
    verticalExportHeaders,
  ]);

  const tableHeaderControls = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
        <SearchInput
          value={(filters.global as DataTableFilterMetaData).value || ''}
          onChange={onGlobalFilterChange}
        />
        <Stack direction="row" spacing={1} alignItems="center">
          <ViewSummariesToggle activeTable={activeTable} setActiveTable={setActiveTable} />
          <Tooltip title="Configure table fields" arrow>
            <IconButton size="small" onClick={() => setConfigDrawerOpen(true)}>
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

          <Tooltip
            title={
              orientation === TableOrientation.FieldsHorizontal
                ? 'Show display fields as rows'
                : 'Show display fields as columns'
            }
            arrow
          >
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
          <ExportTableData
            dataToExport={activeExportRows}
            headers={
              orientation === TableOrientation.FieldsHorizontal
                ? horizontalExportHeaders
                : verticalExportHeaders
            }
            disabled={showEmptyState}
            fileNamePrefix="data_summary"
          />
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
      <CustomDrawer drawerOpen={configDrawerOpen} setDrawerOpen={setConfigDrawerOpen}>
        <PivotFieldConfig
          pivotConfig={pivotConfig}
          fieldTypes={fieldTypes}
          fieldLabelByKey={fieldLabelByKey}
          binSizeInputText={binSizeInputText}
          topNInputText={topNInputText}
          onRemoveGroupByField={handleRemoveGroupByField}
          onRemoveDisplayField={handleRemoveDisplayField}
          onSetGroupByGranularity={setGroupByGranularity}
          onSetGroupByTopNEnabled={setGroupByTopNEnabled}
          onSetGroupByTopNInputChange={handleGroupByTopNInputChange}
          setGroupByTopNGlobal={handleSetGroupByTopNGlobal}
          onTopNSizeBlur={handleTopNBlur}
          onSetBinningEnabled={setBinningEnabled}
          onBinSizeInputChange={handleBinSizeInputChange}
          onBinSizeBlur={handleBinSizeBlur}
          onToggleAggregation={toggleAggregation}
          sortedFields={sortedFields}
          onDisplayFieldsChange={handleDisplayFieldsChange}
          onGroupByFieldsChange={handleGroupByChange}
          onShowTotalCountFooterChange={handleShowTotalCountFooterChange}
          onShowRelativePercentagesChange={onShowRelativePercentagesChange}
          onHideEmptyNullGroupsChange={onHideEmptyNullGroupsChange}
          handleReset={handleReset}
        />
      </CustomDrawer>

      {orientation === TableOrientation.FieldsHorizontal && (
        <Paper variant="outlined">
          <DataTable
            // Key needed to force re-render when groupByFields or groupByTopNSize changes, otherwise the table will not update correctly
            key={`horizontal_${JSON.stringify(pivotConfig)}`}
            value={shouldShowTable ? horizontalTableRows : []}
            size="small"
            className="my-flexible-table"
            scrollable
            ref={horizontalTableRef}
            rowGroupMode="rowspan"
            // Limitation of the current implementation: DataTable is designed for single-level grouping only
            // This means that if the user selects multiple group-by fields, only the first one will be used for grouping in the table display
            groupRowsBy={
              pivotConfig.groupByFields.length > 0 ? pivotConfig.groupByFields[0] : undefined
            }
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
                  {/* Total display */}
                  <Column
                    header="Total records"
                    rowSpan={2}
                    className="flexible-column"
                    bodyClassName="value-cells"
                  />
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
            footerColumnGroup={
              pivotConfig.showTotalCountFooter ? (
                <ColumnGroup>
                  <Row>
                    {pivotConfig.groupByFields.map((col, index) => (
                      <Column
                        key={`footer_groupby_${col}`}
                        footer={index === 0 ? 'Total' : ''}
                        footerStyle={{ fontWeight: 'bold' }}
                        className="flexible-column"
                      />
                    ))}
                    <Column
                      key="footer_total_records"
                      footer={
                        pivotConfig.groupByFields.length === 0
                          ? `Total (${horizontalColumnTotals[TOTAL_FIELD] ?? 0})`
                          : (horizontalColumnTotals[TOTAL_FIELD] ?? 0)
                      }
                      footerStyle={{ fontWeight: 'bold' }}
                      className="flexible-column"
                    />
                    {pivotConfig.displayFields.flatMap((col) =>
                      (pivotConfig.selectedAggregations[col] ?? []).map((agg) => {
                        const key = `${col}__${agg}`;
                        return (
                          <Column
                            key={`footer_agg_${key}`}
                            footer={horizontalColumnTotals[key] ?? '—'}
                            footerStyle={{ fontWeight: 'bold' }}
                            className="flexible-column"
                          />
                        );
                      }),
                    )}
                  </Row>
                </ColumnGroup>
              ) : null
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
            {/* Total display */}
            <Column
              field={TOTAL_FIELD}
              className="flexible-column"
              bodyClassName="value-cells"
              body={(rowData) =>
                renderCell(
                  rowData[TOTAL_FIELD],
                  rowData[`${TOTAL_FIELD}__pct`],
                  pivotConfig.showRelativePercentages,
                )
              }
            />
            {pivotConfig.displayFields.map((col) =>
              (pivotConfig.selectedAggregations[col] ?? []).map((agg) => {
                const key = `${col}__${agg}`;
                return (
                  <Column
                    key={key}
                    field={key}
                    header={`${fieldLabelByKey[col] ?? col} (${AGG_TYPE_LABELS[agg]})`}
                    className="flexible-column"
                    bodyClassName="value-cells"
                    body={(rowData) =>
                      renderCell(
                        rowData[key],
                        rowData[`${key}__pct`],
                        pivotConfig.showRelativePercentages,
                      )
                    }
                  />
                );
              }),
            )}
          </DataTable>
        </Paper>
      )}

      {orientation === TableOrientation.FieldsVertical && (
        <Paper variant="outlined">
          <DataTable
            key={`vertical_${JSON.stringify(pivotConfig)}`}
            value={shouldShowTable ? verticalTableRows : []}
            size="small"
            emptyMessage={emptyStateMessage}
            scrollable
            ref={verticalTableRef}
            header={tableHeaderControls}
            filters={filters}
            globalFilterFields={verticalGlobalFilterFields}
            rowGroupMode="rowspan"
            groupRowsBy={
              pivotConfig.groupByFields.length > 0 ? pivotConfig.groupByFields[0] : 'field'
            }
            className="my-flexible-table"
            /* Only show footer totals if there are active group-by fields */
            footerColumnGroup={
              pivotConfig.showTotalCountFooter ? (
                <ColumnGroup>
                  <Row>
                    <Column
                      footer="Total (distinct)"
                      colSpan={1 + pivotConfig.groupByFields.length}
                      footerStyle={{ fontWeight: 'bold' }}
                      className="flexible-column"
                    />
                    {/* Overall total of record counts */}
                    <Column
                      footer={verticalColumnTotals[TOTAL_FIELD] ?? 0}
                      footerStyle={{ fontWeight: 'bold' }}
                      className="flexible-column"
                    />
                    {/* Totals for each aggregation column */}
                    {verticalAggregationColumns.map((agg) => (
                      <Column
                        key={agg}
                        footer={'—'}
                        footerStyle={{ fontWeight: 'bold' }}
                        className="flexible-column"
                      />
                    ))}
                  </Row>
                </ColumnGroup>
              ) : null
            }
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
            <Column
              field={TOTAL_FIELD}
              header="Total records"
              className="flexible-column"
              bodyClassName="value-cells"
              body={(rowData) =>
                renderCell(
                  rowData[TOTAL_FIELD],
                  rowData[`${TOTAL_FIELD}__pct`],
                  pivotConfig.showRelativePercentages,
                )
              }
            />
            {verticalAggregationColumns.map((agg) => (
              <Column
                key={agg}
                field={agg}
                header={AGG_TYPE_LABELS[agg]}
                className="flexible-column"
                bodyClassName="value-cells"
                body={(rowData) =>
                  renderCell(
                    rowData[agg],
                    rowData[`${agg}__pct`],
                    pivotConfig.showRelativePercentages,
                  )
                }
              />
            ))}
          </DataTable>
        </Paper>
      )}
    </Box>
  );
}

export default DataSummaries;
