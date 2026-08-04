import {
  DeleteOutline,
  // DragIndicator,
  InfoOutlined,
  KeyboardArrowDown,
  QuestionMark,
} from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Checkbox,
  Divider,
  FormControlLabel,
  FormGroup,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { type KeyboardEvent, type MouseEvent, useState } from 'react';
import { Theme } from '../../assets/themes/theme';
import FieldTypes from '../../constants/fieldTypes';
import type { MetaDataColumn, ProjectViewField } from '../../types/dtos';
import { FIELD_TYPE_COLOURS, FIELD_TYPE_ICONS } from '../Fields/fieldsMeta';
import {
  AGG_TYPE_LABELS,
  type AggregationType,
  DATE_GRANULARITY_LABELS,
  DateGranularity,
  FIELD_TYPE_AGGREGATION_TYPES,
  type FieldTypeMap,
  type PivotConfig,
  UNAVAILABLE_FIELDS,
} from './dataSummariesMeta';

const DATE_GRANULARITY_OPTIONS = Object.values(DateGranularity);

interface PivotFieldConfigProps {
  pivotConfig: PivotConfig;
  fieldTypes: FieldTypeMap;
  fieldLabelByKey: Record<string, string>;
  binSizeInputText: Record<string, string>;
  sortedFields: (ProjectViewField | MetaDataColumn)[];
  onDisplayFieldsChange: (nextDisplayFields: string[]) => void;
  onGroupByFieldsChange: (nextGroupByFields: string[]) => void;
  onRemoveGroupByField: (col: string) => void;
  onRemoveDisplayField: (col: string) => void;
  onSetGroupByGranularity: (col: string, granularity: DateGranularity) => void;
  onSetBinningEnabled: (col: string, enabled: boolean) => void;
  onBinSizeInputChange: (col: string, rawValue: string) => void;
  onBinSizeBlur: (col: string) => void;
  onToggleAggregation: (col: string, agg: AggregationType) => void;
  onShowTotalCountFooterChange: (show: boolean) => void;
}

// Field icon + type tooltip
function FieldTypeIndicator({ fieldType }: { fieldType: FieldTypes }) {
  const FieldIcon = FIELD_TYPE_ICONS[fieldType];

  if (!FieldIcon) {
    return (
      <Tooltip title="Unknown field type" arrow placement="left">
        <QuestionMark sx={{ fontSize: 16, color: Theme.PrimaryGrey500 }} />
      </Tooltip>
    );
  }

  return (
    <Tooltip title={`Field type: ${fieldType}`} arrow placement="left">
      <FieldIcon
        sx={{
          fontSize: 16,
          color: FIELD_TYPE_COLOURS[fieldType] ?? Theme.PrimaryGrey500,
          '&:hover': { opacity: 0.6 },
          transition: 'opacity 0.15s ease',
        }}
      />
    </Tooltip>
  );
}

// Shared field box styling
const rowBoxSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
  minWidth: '100%',
  flexShrink: 0,
  backgroundColor: Theme.PrimaryGrey200,
  borderRadius: 1,
  fontWeight: 'bold',
  typography: 'button',
  textTransform: 'none',
  cursor: 'pointer',
  paddingY: 0.5,
  paddingLeft: 1,
  paddingRight: 0.5,
  transition: 'background-color 0.15s ease',
  '&:hover': {
    backgroundColor: alpha(Theme.PrimaryGrey200, 0.7),
  },
} as const;

// Anchor the menu off the right edge of the row instead of the left
const menuAnchorProps = {
  anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
  transformOrigin: { vertical: 'top', horizontal: 'right' },
} as const;

function PivotFieldConfig(props: PivotFieldConfigProps) {
  const {
    pivotConfig,
    fieldTypes,
    fieldLabelByKey,
    binSizeInputText,
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
  } = props;

  // Group-by and display menu anchor states
  const [groupByMenu, setGroupByMenu] = useState<{ col: string; anchorEl: HTMLElement } | null>(
    null,
  );
  const [displayMenu, setDisplayMenu] = useState<{ col: string; anchorEl: HTMLElement } | null>(
    null,
  );

  const openGroupByMenu = (
    col: string,
    e: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>,
  ) => setGroupByMenu({ col, anchorEl: e.currentTarget });
  const closeGroupByMenu = () => setGroupByMenu(null);

  const openDisplayMenu = (
    col: string,
    e: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>,
  ) => setDisplayMenu({ col, anchorEl: e.currentTarget });
  const closeDisplayMenu = () => setDisplayMenu(null);

  function renderFieldSelect(value: string[] = [], onChange: (nextValues: string[]) => void) {
    const optionKeys = sortedFields.map((f) => f.columnName);

    return (
      <Autocomplete
        multiple
        size="small"
        limitTags={1}
        disableCloseOnSelect
        options={optionKeys}
        value={value}
        onChange={(_, newValues) => {
          onChange(newValues);
        }}
        getOptionDisabled={(key) => UNAVAILABLE_FIELDS.has(key)}
        getOptionLabel={(key) => fieldLabelByKey[key] ?? key}
        renderOption={(props, key, { selected }) => {
          const { key: optionKey, ...otherProps } = props;
          const isUnavailable = UNAVAILABLE_FIELDS.has(key);

          return (
            <li key={optionKey} {...otherProps}>
              <Checkbox checked={selected} sx={{ '& .MuiSvgIcon-root': { fontSize: 16 } }} />
              <Box component="span" sx={{ flexGrow: 1 }}>
                {fieldLabelByKey[key] ?? key}
              </Box>
              {isUnavailable && (
                <Tooltip title="Unavailable for summary generation" arrow>
                  <InfoOutlined fontSize="small" color="action" />
                </Tooltip>
              )}
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Select fields"
            sx={{
              mb: 2,
            }}
          />
        )}
      />
    );
  }

  return (
    <Box sx={{ p: 0, width: 400 }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold' }}>
        Options
      </Typography>
      <Typography variant="body2">
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={pivotConfig.showTotalCountFooter}
                onChange={(e) => onShowTotalCountFooterChange(e.target.checked)}
              />
            }
            label={<Typography variant="body2">Show total count footer</Typography>}
          />
        </FormGroup>
      </Typography>
      <br />
      {/* DISPLAY FIELDS */}
      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold' }}>
        Display fields
      </Typography>
      {renderFieldSelect(pivotConfig.displayFields, onDisplayFieldsChange)}
      {pivotConfig.displayFields.length !== 0 ? (
        <Stack spacing={1}>
          {pivotConfig.displayFields.map((col) => {
            return (
              <Box
                key={col}
                sx={{
                  ...rowBoxSx,
                }}
                role="button"
                tabIndex={0}
                onClick={(e) => openDisplayMenu(col, e)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openDisplayMenu(col, e);
                  }
                }}
              >
                {/* <DragIndicator
                  fontSize="small"
                  sx={{ mr: 0.5, color: Theme.PrimaryGrey500, cursor: 'grab' }}
                  onClick={(e) => e.stopPropagation()}
                /> */}
                <FieldTypeIndicator fieldType={fieldTypes[col]} />
                <Box sx={{ flex: 1 }}>{fieldLabelByKey[col] ?? col}</Box>
                <KeyboardArrowDown fontSize="small" sx={{ color: Theme.PrimaryGrey500 }} />
              </Box>
            );
          })}
        </Stack>
      ) : null}

      {/* Display field aggregation menu */}
      <Menu
        anchorEl={displayMenu?.anchorEl}
        open={Boolean(displayMenu)}
        onClose={closeDisplayMenu}
        {...menuAnchorProps}
      >
        <Typography
          variant="caption"
          sx={{ px: 2, py: 0.5, color: Theme.PrimaryGrey500, display: 'block' }}
        >
          Aggregations
        </Typography>

        {displayMenu &&
        (FIELD_TYPE_AGGREGATION_TYPES[fieldTypes[displayMenu.col]] ?? []).length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              No options available for this field
            </Typography>
          </MenuItem>
        ) : (
          displayMenu &&
          (FIELD_TYPE_AGGREGATION_TYPES[fieldTypes[displayMenu.col]] ?? []).map((agg) => {
            const isSelected = (pivotConfig.selectedAggregations[displayMenu.col] ?? []).includes(
              agg,
            );
            return (
              <MenuItem key={agg} onClick={() => onToggleAggregation(displayMenu.col, agg)}>
                <Checkbox size="small" checked={isSelected} sx={{ mr: 1, p: 0 }} />
                <Typography variant="body2">{AGG_TYPE_LABELS[agg]}</Typography>
              </MenuItem>
            );
          })
        )}
        <Divider />
        <MenuItem
          onClick={() => {
            if (displayMenu) onRemoveDisplayField(displayMenu.col);
            closeDisplayMenu();
          }}
          sx={{ color: Theme.SecondaryRed }}
        >
          <DeleteOutline fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="body2">Remove from table</Typography>
        </MenuItem>
      </Menu>
      <br />
      {/* GROUP-BY FIELDS */}
      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold' }}>
        Group-by fields
      </Typography>
      {renderFieldSelect(pivotConfig.groupByFields, onGroupByFieldsChange)}
      {pivotConfig.groupByFields.length !== 0 ? (
        <Stack spacing={1}>
          {pivotConfig.groupByFields.map((col) => {
            return (
              <Box
                key={col}
                sx={{
                  ...rowBoxSx,
                }}
                role="button"
                tabIndex={0}
                onClick={(e) => openGroupByMenu(col, e)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openGroupByMenu(col, e);
                  }
                }}
              >
                {/* <DragIndicator
                  fontSize="small"
                  sx={{ mr: 0.5, color: Theme.PrimaryGrey500, cursor: 'grab' }}
                  onClick={(e) => e.stopPropagation()}
                /> */}
                <FieldTypeIndicator fieldType={fieldTypes[col]} />
                <Box sx={{ flex: 1 }}>{fieldLabelByKey[col] ?? col}</Box>
                <KeyboardArrowDown fontSize="small" sx={{ color: Theme.PrimaryGrey500 }} />
              </Box>
            );
          })}
        </Stack>
      ) : null}

      {/* Group-by options menu (date granularity / binning) */}
      <Menu
        anchorEl={groupByMenu?.anchorEl}
        open={Boolean(groupByMenu)}
        onClose={closeGroupByMenu}
        {...menuAnchorProps}
      >
        {groupByMenu && fieldTypes[groupByMenu.col] === FieldTypes.DATE && (
          <Typography
            variant="caption"
            sx={{ px: 2, py: 0.5, color: Theme.PrimaryGrey500, display: 'block' }}
          >
            Date granularity
          </Typography>
        )}

        {groupByMenu &&
          fieldTypes[groupByMenu.col] === FieldTypes.DATE &&
          DATE_GRANULARITY_OPTIONS.map((option) => {
            const isSelected =
              (pivotConfig.groupByGranularity[groupByMenu.col] ?? DateGranularity.Month) === option;
            return (
              <MenuItem
                key={option}
                selected={isSelected}
                onClick={() => {
                  onSetGroupByGranularity(groupByMenu.col, option);
                  closeGroupByMenu();
                }}
              >
                <Typography variant="body2">{DATE_GRANULARITY_LABELS[option]}</Typography>
              </MenuItem>
            );
          })}

        {groupByMenu &&
          (fieldTypes[groupByMenu.col] === FieldTypes.NUMBER ||
            fieldTypes[groupByMenu.col] === FieldTypes.DOUBLE) && [
            <Typography
              key="number-binning-title"
              variant="caption"
              sx={{ px: 2, py: 0.5, color: Theme.PrimaryGrey500, display: 'block' }}
            >
              Number binning
            </Typography>,
            <MenuItem
              key="binning-toggle"
              onClick={(e) => e.stopPropagation()}
              disableRipple
              sx={{ '&:hover': { backgroundColor: 'transparent' } }}
            >
              <FormGroup>
                <FormControlLabel
                  sx={{ mr: 0, p: 0 }}
                  control={
                    <Checkbox
                      size="small"
                      checked={pivotConfig.groupByBinSize[groupByMenu.col] !== undefined}
                      onChange={(e) => onSetBinningEnabled(groupByMenu.col, e.target.checked)}
                    />
                  }
                  label={<Typography variant="body2">Group into bins</Typography>}
                />
              </FormGroup>
            </MenuItem>,
            pivotConfig.groupByBinSize[groupByMenu.col] !== undefined && (
              <MenuItem
                key="bin-size"
                onClick={(e) => e.stopPropagation()}
                disableRipple
                sx={{ '&:hover': { backgroundColor: 'transparent' } }}
              >
                <TextField
                  type="number"
                  label="Bin size"
                  size="small"
                  sx={{ width: 120 }}
                  value={
                    binSizeInputText[groupByMenu.col] ??
                    pivotConfig.groupByBinSize[groupByMenu.col] ??
                    ''
                  }
                  onChange={(e) => onBinSizeInputChange(groupByMenu.col, e.target.value)}
                  onBlur={() => onBinSizeBlur(groupByMenu.col)}
                  slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                />
              </MenuItem>
            ),
          ]}

        {groupByMenu &&
          fieldTypes[groupByMenu.col] !== FieldTypes.DATE &&
          fieldTypes[groupByMenu.col] !== FieldTypes.NUMBER &&
          fieldTypes[groupByMenu.col] !== FieldTypes.DOUBLE && (
            <MenuItem disabled>
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                No options available for this field
              </Typography>
            </MenuItem>
          )}

        <Divider />
        <MenuItem
          onClick={() => {
            if (groupByMenu) onRemoveGroupByField(groupByMenu.col);
            closeGroupByMenu();
          }}
          sx={{ color: Theme.SecondaryRed }}
        >
          <DeleteOutline fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="body2">Remove from table</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default PivotFieldConfig;
