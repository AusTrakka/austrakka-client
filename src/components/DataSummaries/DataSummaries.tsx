import { RestartAlt, SwapHoriz, Tune } from '@mui/icons-material';
import {
  Badge,
  Box,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { FilterMatchMode } from 'primereact/api';
import type { DataTableFilterMetaData } from 'primereact/datatable';
import { type ChangeEvent, useMemo, useState } from 'react';
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
  type FieldTypeMap,
  type GroupByBinSizeMap,
  type GroupByGranularityMap,
  type GroupByTopNMap,
  type PivotConfig,
  type RowRecord,
  TableOrientation,
} from './dataSummariesMeta';
import { buildPivotGroups } from './dataSummariesUtils';
import { HorizontalModeTable } from './HorizontalModeTable';
import { useHorizontalPivotData } from './hooks/useHorizontalPivotData';
import { useVerticalPivotData } from './hooks/useVerticalPivotData';
import PivotConfigOptions from './PivotConfig/PivotConfigOptions';
import { VerticalModeTable } from './VerticalModeTable';
import ViewSummariesToggle from './ViewSummariesToggle';

// Possible enhancements:
// - Support for aggregation/pivoting on Shared_groups field (and other multi-value fields)
// - Consider adding the ability for matrix-style pivoting (2 dimensions of grouping rather than just a single group-by dimension, "show fields as column values" per display field maybe)
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

function DataSummaries(props: DataSummariesProps) {
  const { data, metadata, activeTable, setActiveTable } = props;

  const [pivotConfig, setPivotConfig] = useState<PivotConfig>(INITIAL_PIVOT_CONFIG);
  const [orientation, setOrientation] = useState<TableOrientation>(
    TableOrientation.FieldsHorizontal,
  );
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);
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

  function handleReset() {
    setPivotConfig(INITIAL_PIVOT_CONFIG);
    setOrientation(TableOrientation.FieldsHorizontal);
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

  function onGlobalFilterChange(event: ChangeEvent<HTMLInputElement>) {
    const { value } = event.target;
    const nextFilters = { ...filters };
    (nextFilters.global as DataTableFilterMetaData).value = value;
    setFilters(nextFilters);
  }

  // Display conditionals
  const showEmptyState = rows.length === 0;
  const shouldShowTable = !showEmptyState;
  const emptyStateMessage = (
    <Typography variant="body2" component="div" sx={{ p: 2 }} color={Theme.PrimaryGrey600}>
      No data available
    </Typography>
  );

  // Compute horizontal and vertical pivot data and export data
  const verticalData = useVerticalPivotData({
    pivotGroups,
    pivotConfig,
    fieldLabelByKey,
    shouldShowTable,
  });

  const horizontalData = useHorizontalPivotData({
    pivotGroups,
    pivotConfig,
    fieldLabelByKey,
    shouldShowTable,
  });

  const activeExportData =
    orientation === TableOrientation.FieldsHorizontal
      ? horizontalData.exportRows
      : verticalData.exportRows;

  const activeExportHeaders =
    orientation === TableOrientation.FieldsHorizontal
      ? horizontalData.exportHeaders
      : verticalData.exportHeaders;

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
            dataToExport={activeExportData}
            headers={activeExportHeaders}
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
        <PivotConfigOptions
          rows={rows}
          handleReset={handleReset}
          pivotConfig={pivotConfig}
          setPivotConfig={setPivotConfig}
          fieldTypes={fieldTypes}
          sortedFields={sortedFields}
        />
      </CustomDrawer>

      {orientation === TableOrientation.FieldsHorizontal && (
        <HorizontalModeTable
          horizontalTableRows={horizontalData.tableRows}
          horizontalColumnTotals={horizontalData.columnTotals}
          pivotConfig={pivotConfig}
          fieldLabelByKey={fieldLabelByKey}
          filters={filters}
          headerControls={tableHeaderControls}
          emptyStateMessage={emptyStateMessage}
          shouldShowTable={shouldShowTable}
        />
      )}

      {orientation === TableOrientation.FieldsVertical && (
        <VerticalModeTable
          verticalTableRows={verticalData.tableRows}
          verticalColumnTotals={verticalData.columnTotals}
          verticalAggregationColumns={verticalData.verticalAggregationColumns}
          pivotConfig={pivotConfig}
          fieldLabelByKey={fieldLabelByKey}
          filters={filters}
          headerControls={tableHeaderControls}
          emptyStateMessage={emptyStateMessage}
          shouldShowTable={shouldShowTable}
        />
      )}
    </Box>
  );
}

export default DataSummaries;
