import { RestartAlt, Tune } from '@mui/icons-material';
import { Box, Button, Typography } from '@mui/material';
import { type KeyboardEvent, type MouseEvent, useState } from 'react';
import { Theme } from '../../../assets/themes/theme';
import type { Field, MetaDataColumn, ProjectViewField } from '../../../types/dtos';
import {
  type AggregationType,
  type DateGranularity,
  type FieldTypeMap,
  type PivotConfig,
  UNAVAILABLE_FIELDS,
} from '../dataSummariesMeta';
import { DisplayFieldMenu } from './DisplayFieldMenu';
import { GroupByFieldMenu } from './GroupByFieldMenu';
import { SortableFieldList } from './SortableFieldList';
import { TableOptions } from './TableOptions';

interface PivotConfigOptionsProps {
  pivotConfig: PivotConfig;
  fieldTypes: FieldTypeMap;
  fieldLabelByKey: Record<string, string>;
  binSizeInputText: Record<string, string>;
  topNInputText: Record<string, string>;
  sortedFields: (ProjectViewField | MetaDataColumn)[];
  onDisplayFieldsChange: (nextDisplayFields: string[]) => void;
  onGroupByFieldsChange: (nextGroupByFields: string[]) => void;
  onRemoveGroupByField: (col: string) => void;
  onRemoveDisplayField: (col: string) => void;
  onSetGroupByGranularity: (col: string, granularity: DateGranularity) => void;
  onSetGroupByTopNEnabled: (col: string, enabled: boolean) => void;
  onSetGroupByTopNInputChange: (col: string, rawValue: string) => void;
  setGroupByTopNGlobal: (col: string, isGlobal: boolean) => void;
  onTopNSizeBlur: (col: string) => void;
  onSetBinningEnabled: (col: string, enabled: boolean) => void;
  onBinSizeInputChange: (col: string, rawValue: string) => void;
  onBinSizeBlur: (col: string) => void;
  onToggleAggregation: (col: string, agg: AggregationType) => void;
  onShowTotalCountFooterChange: (show: boolean) => void;
  onShowRelativePercentagesChange: (show: boolean) => void;
  onHideEmptyNullGroupsChange: (hide: boolean) => void;
  handleReset: () => void;
}

function PivotConfigOptions(props: PivotConfigOptionsProps) {
  const {
    pivotConfig,
    fieldTypes,
    binSizeInputText,
    topNInputText,
    onRemoveGroupByField,
    onRemoveDisplayField,
    onSetGroupByGranularity,
    onSetBinningEnabled,
    onBinSizeInputChange,
    onBinSizeBlur,
    onToggleAggregation,
    sortedFields,
    onDisplayFieldsChange,
    onGroupByFieldsChange,
    onShowTotalCountFooterChange,
    onSetGroupByTopNEnabled,
    onSetGroupByTopNInputChange,
    onTopNSizeBlur,
    setGroupByTopNGlobal,
    onShowRelativePercentagesChange,
    onHideEmptyNullGroupsChange,
    handleReset,
  } = props;

  // Group-by and display menu anchor states
  const [groupByAnchorEl, setGroupByAnchorEl] = useState<HTMLElement | null>(null);
  const [activeGroupByCol, setActiveGroupByCol] = useState<string | null>(null);
  const [displayAnchorEl, setDisplayAnchorEl] = useState<HTMLElement | null>(null);
  const [activeDisplayCol, setActiveDisplayCol] = useState<string | null>(null);

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

  const TABLE_OPTIONS = [
    {
      id: 'showTotalCountFooter',
      label: 'Show total count footer',
      checked: pivotConfig.showTotalCountFooter,
      onChange: onShowTotalCountFooterChange,
    },
    {
      id: 'showRelativePercentages',
      label: 'Show relative percentages',
      description:
        'Relative percentages represent percentages relative to the total count of records visible in the table. These percentages are only calculated for row-count metrics (e.g. total count) and will not be calculated for other aggregation types (e.g. sum, mean, median).',
      checked: pivotConfig.showRelativePercentages,
      onChange: onShowRelativePercentagesChange,
    },
    {
      id: 'hideEmptyNullGroups',
      label: 'Hide empty/null groups',
      description:
        'This option hides all groups where one or more group-by fields have empty or null values. Hiding these groups will affect the total counts and relative percentages for other groups within the table. This option will only have a visible effect if there are group-by fields selected and there are empty/null values for those fields in the dataset.',
      checked: pivotConfig.hideEmptyNullGroups,
      onChange: onHideEmptyNullGroupsChange,
    },
  ];

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
        <TableOptions options={TABLE_OPTIONS} />
        <SortableFieldList
          title="Display fields"
          fields={sortedFields as Field[]}
          selectedFieldNames={pivotConfig.displayFields}
          onChange={onDisplayFieldsChange}
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
          onToggleAggregation={onToggleAggregation}
          onRemoveDisplayField={onRemoveDisplayField}
        />
        <br />
        <SortableFieldList
          title="Group-by fields"
          fields={sortedFields as Field[]}
          selectedFieldNames={pivotConfig.groupByFields}
          onChange={onGroupByFieldsChange}
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
          onRemoveGroupByField={onRemoveGroupByField}
          onSetGroupByGranularity={onSetGroupByGranularity}
          onSetBinningEnabled={onSetBinningEnabled}
          onBinSizeInputChange={onBinSizeInputChange}
          onBinSizeBlur={onBinSizeBlur}
          onSetGroupByTopNEnabled={onSetGroupByTopNEnabled}
          onSetGroupByTopNInputChange={onSetGroupByTopNInputChange}
          onTopNSizeBlur={onTopNSizeBlur}
          setGroupByTopNGlobal={setGroupByTopNGlobal}
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
