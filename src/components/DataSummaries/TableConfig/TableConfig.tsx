import { RestartAlt, Tune } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import {
  type Dispatch,
  type KeyboardEvent,
  type MouseEvent,
  type SetStateAction,
  useState,
} from 'react';
import { Theme } from '../../../assets/themes/theme';
import type { MetaDataColumn, ProjectViewField } from '../../../types/dtos';
import {
  type AggregationType,
  FIELD_TYPE_AGGREGATION_TYPES,
  type FieldTypeMap,
  type GroupByBinSizeMap,
  type GroupByGranularityMap,
  type GroupByTopNMap,
  type PivotConfig,
  type RowRecord,
  UNAVAILABLE_FIELDS,
} from '../dataSummariesMeta';
import { DisplayFieldMenu } from './DisplayFieldMenu';
import { GlobalOptions } from './GlobalOptions';
import { GroupByFieldMenu } from './GroupByFieldMenu';
import { SortableFieldList } from './SortableFieldList';

interface TableConfigProps {
  pivotConfig: PivotConfig;
  fieldTypes: FieldTypeMap;
  handleReset: () => void;
  rows: RowRecord[];
  sortedFields: (ProjectViewField | MetaDataColumn)[];
  setPivotConfig: Dispatch<SetStateAction<PivotConfig>>;
}

function TableConfig(props: TableConfigProps) {
  const { pivotConfig, fieldTypes, setPivotConfig, rows, sortedFields, handleReset } = props;

  // Group-by and display menu anchor states
  const [groupByAnchorEl, setGroupByAnchorEl] = useState<HTMLElement | null>(null);
  const [activeGroupByCol, setActiveGroupByCol] = useState<string | null>(null);
  const [displayAnchorEl, setDisplayAnchorEl] = useState<HTMLElement | null>(null);
  const [activeDisplayCol, setActiveDisplayCol] = useState<string | null>(null);

  const openGroupByFieldMenu = (
    col: string,
    e: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>,
  ) => {
    setActiveGroupByCol(col);
    setGroupByAnchorEl(e.currentTarget);
  };

  const openDisplayFieldMenu = (
    col: string,
    e: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>,
  ) => {
    setActiveDisplayCol(col);
    setDisplayAnchorEl(e.currentTarget);
  };

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

  function handleGroupByChange(nextGroupByFields: string[]) {
    setPivotConfig((prev) => {
      const nextGranularity: GroupByGranularityMap = {};
      const nextBinSize: GroupByBinSizeMap = {};
      const nextTopN: GroupByTopNMap = {};
      const nextTopNGlobal: Record<string, boolean> = {};

      for (const col of nextGroupByFields) {
        if (prev.groupByGranularity[col]) {
          nextGranularity[col] = prev.groupByGranularity[col];
        }
        if (prev.groupByBinSize[col] !== undefined) {
          nextBinSize[col] = prev.groupByBinSize[col];
        }
        if (prev.groupByTopNSize[col] !== undefined) {
          nextTopN[col] = prev.groupByTopNSize[col];
        }
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

  return (
    <Box
      sx={{
        width: 400,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box>
        <Tune fontSize="large" color="primary" />
        <Typography variant="h4" color="primary" sx={{ mb: 1.5 }}>
          Table configuration
        </Typography>
        <GlobalOptions pivotConfig={pivotConfig} setPivotConfig={setPivotConfig} />
        <Box sx={{ my: 2 }}>
          <SortableFieldList
            title="Display fields"
            fields={sortedFields}
            selectedFieldNames={pivotConfig.displayFields}
            onChange={handleDisplayFieldsChange}
            onOpenItemMenu={openDisplayFieldMenu}
            unavailableFields={UNAVAILABLE_FIELDS}
          />
          <DisplayFieldMenu
            anchorEl={displayAnchorEl}
            activeCol={activeDisplayCol}
            fieldType={activeDisplayCol ? fieldTypes[activeDisplayCol] : undefined}
            selectedAggregations={
              activeDisplayCol ? (pivotConfig.selectedAggregations[activeDisplayCol] ?? []) : []
            }
            onClose={() => setDisplayAnchorEl(null)}
            setPivotConfig={setPivotConfig}
          />
        </Box>
        <Box>
          <SortableFieldList
            title="Group-by fields"
            fields={sortedFields}
            selectedFieldNames={pivotConfig.groupByFields}
            onChange={handleGroupByChange}
            onOpenItemMenu={openGroupByFieldMenu}
            unavailableFields={UNAVAILABLE_FIELDS}
          />
          <GroupByFieldMenu
            setPivotConfig={setPivotConfig}
            anchorEl={groupByAnchorEl}
            activeCol={activeGroupByCol}
            fieldType={activeGroupByCol ? fieldTypes[activeGroupByCol] : undefined}
            pivotConfig={pivotConfig}
            rows={rows}
            onClose={() => setGroupByAnchorEl(null)}
          />
        </Box>
      </Box>
      <Box sx={{ mt: 'auto', mb: 1, display: 'flex', justifyContent: 'flex-start' }}>
        <Button
          startIcon={<RestartAlt fontSize="small" />}
          onClick={handleReset}
          sx={{
            textTransform: 'none',
            backgroundColor: Theme.PrimaryGrey200,
            '&:hover': { backgroundColor: Theme.PrimaryGrey300 },
          }}
        >
          Reset to default
        </Button>
      </Box>
    </Box>
  );
}

export default TableConfig;
