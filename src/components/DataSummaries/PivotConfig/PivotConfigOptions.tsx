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
import type { Field, MetaDataColumn, ProjectViewField } from '../../../types/dtos';
import {
  type AggregationType,
  type DateGranularity,
  FIELD_TYPE_AGGREGATION_TYPES,
  type FieldTypeMap,
  type GroupByBinSizeMap,
  type GroupByGranularityMap,
  type GroupByTopNMap,
  type PivotConfig,
  type RowRecord,
  type TableOrientation,
  UNAVAILABLE_FIELDS,
} from '../dataSummariesMeta';
import { computeSuggestedBinSize } from '../dataSummariesUtils';
import { DisplayFieldMenu } from './DisplayFieldMenu';
import { GroupByFieldMenu } from './GroupByFieldMenu';
import { SortableFieldList } from './SortableFieldList';
import { TableMenu } from './TableMenu';

interface PivotConfigOptionsProps {
  pivotConfig: PivotConfig;
  fieldTypes: FieldTypeMap;
  handleReset: () => void;
  fieldLabelByKey: Record<string, string>;
  rows: RowRecord[];
  sortedFields: (ProjectViewField | MetaDataColumn)[];
  setOrientation: (orientation: TableOrientation) => void;
  setPivotConfig: Dispatch<SetStateAction<PivotConfig>>;
}

function PivotConfigOptions(props: PivotConfigOptionsProps) {
  const { pivotConfig, fieldTypes, setPivotConfig, rows, sortedFields, handleReset } = props;

  // Group-by and display menu anchor states
  const [groupByAnchorEl, setGroupByAnchorEl] = useState<HTMLElement | null>(null);
  const [activeGroupByCol, setActiveGroupByCol] = useState<string | null>(null);
  const [displayAnchorEl, setDisplayAnchorEl] = useState<HTMLElement | null>(null);
  const [activeDisplayCol, setActiveDisplayCol] = useState<string | null>(null);

  // Handlers for updating the pivot config state

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

  function handleBinSizeBlur(col: string) {
    setBinSizeInputText((prev) => {
      const next = { ...prev };
      delete next[col];
      return next;
    });
  }

  function handleTopNBlur(col: string) {
    setTopNInputText((prev) => {
      const next = { ...prev };
      delete next[col];
      return next;
    });
  }

  const openActiveGroupByCol = (
    col: string,
    e: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>,
  ) => {
    setActiveGroupByCol(col);
    setGroupByAnchorEl(e.currentTarget);
  };

  const openDisplayMenu = (
    col: string,
    e: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>,
  ) => {
    setActiveDisplayCol(col);
    setDisplayAnchorEl(e.currentTarget);
  };

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
        <TableMenu pivotConfig={pivotConfig} setPivotConfig={setPivotConfig} />
        <SortableFieldList
          title="Display fields"
          fields={sortedFields as Field[]}
          selectedFieldNames={pivotConfig.displayFields}
          onChange={handleDisplayFieldsChange}
          onOpenItemMenu={openDisplayMenu}
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
          onToggleAggregation={toggleAggregation}
          onRemoveDisplayField={handleRemoveDisplayField}
        />
        <br />
        <SortableFieldList
          title="Group-by fields"
          fields={sortedFields as Field[]}
          selectedFieldNames={pivotConfig.groupByFields}
          onChange={handleGroupByChange}
          onOpenItemMenu={openActiveGroupByCol}
          unavailableFields={UNAVAILABLE_FIELDS}
        />
        <GroupByFieldMenu
          anchorEl={groupByAnchorEl}
          activeCol={activeGroupByCol}
          fieldType={activeGroupByCol ? fieldTypes[activeGroupByCol] : undefined}
          pivotConfig={pivotConfig}
          binSizeInputText={binSizeInputText}
          topNInputText={topNInputText}
          onClose={() => setGroupByAnchorEl(null)}
          onRemoveGroupByField={handleRemoveGroupByField}
          onSetGroupByGranularity={setGroupByGranularity}
          onSetBinningEnabled={setBinningEnabled}
          onBinSizeInputChange={handleBinSizeInputChange}
          onBinSizeBlur={handleBinSizeBlur}
          onSetGroupByTopNEnabled={setGroupByTopNEnabled}
          onSetGroupByTopNInputChange={handleGroupByTopNInputChange}
          onTopNSizeBlur={handleTopNBlur}
          setGroupByTopNGlobal={handleSetGroupByTopNGlobal}
        />
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

export default PivotConfigOptions;
