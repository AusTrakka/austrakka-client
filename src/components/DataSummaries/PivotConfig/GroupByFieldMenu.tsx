import { DeleteOutline, InfoOutlined } from '@mui/icons-material';
import {
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  IconButton,
  Menu,
  MenuItem,
  Popover,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Theme } from '../../../assets/themes/theme';
import FieldTypes from '../../../constants/fieldTypes';
import { DATE_GRANULARITY_LABELS, DateGranularity, type PivotConfig } from '../dataSummariesMeta';

const DATE_GRANULARITY_OPTIONS = Object.values(DateGranularity);

const menuAnchorProps = {
  anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
  transformOrigin: { vertical: 'top', horizontal: 'right' },
} as const;

function DateGranularityOptions({
  activeCol,
  pivotConfig,
  onSetGroupByGranularity,
}: {
  activeCol: string;
  pivotConfig: PivotConfig;
  onSetGroupByGranularity: (col: string, granularity: DateGranularity) => void;
}) {
  const selectedValue = pivotConfig.groupByGranularity[activeCol] ?? DateGranularity.Month;

  return (
    <>
      <Typography
        variant="caption"
        sx={{ px: 2, py: 0.5, color: Theme.PrimaryGrey500, display: 'block' }}
      >
        Date granularity
      </Typography>

      <RadioGroup value={selectedValue}>
        {DATE_GRANULARITY_OPTIONS.map((option) => {
          const isSelected = selectedValue === option;
          return (
            <MenuItem
              key={option}
              selected={isSelected}
              onClick={() => {
                onSetGroupByGranularity(activeCol, option);
                // onClose();
              }}
            >
              <Radio checked={isSelected} size="small" sx={{ mr: 1.5, p: 0 }} />
              <Typography variant="body2">{DATE_GRANULARITY_LABELS[option]}</Typography>
            </MenuItem>
          );
        })}
      </RadioGroup>
    </>
  );
}

function NumberBinningOptions({
  activeCol,
  pivotConfig,
  binSizeInputText,
  onSetBinningEnabled,
  onBinSizeInputChange,
  onBinSizeBlur,
}: {
  activeCol: string;
  pivotConfig: PivotConfig;
  binSizeInputText: Record<string, string>;
  onSetBinningEnabled: (col: string, enabled: boolean) => void;
  onBinSizeInputChange: (col: string, rawValue: string) => void;
  onBinSizeBlur: (col: string) => void;
}) {
  const binningEnabled = pivotConfig.groupByBinSize[activeCol] !== undefined;

  return (
    <>
      <MenuItem>
        <FormGroup>
          <FormControlLabel
            sx={{ mr: 0, p: 0 }}
            control={
              <Checkbox
                size="small"
                checked={binningEnabled}
                onChange={(e) => onSetBinningEnabled(activeCol, e.target.checked)}
              />
            }
            label={<Typography variant="body2">Group into bins</Typography>}
          />
        </FormGroup>
      </MenuItem>
      {binningEnabled && (
        <MenuItem
          onClick={(e) => e.stopPropagation()}
          disableRipple
          sx={{
            display: 'flex',
            flexDirection: 'column',
            '&:hover': { backgroundColor: 'transparent', cursor: 'default' },
          }}
        >
          <TextField
            type="number"
            label="Bin size"
            size="small"
            sx={{ width: 120, mt: 0.5, mb: 1.5 }}
            value={binSizeInputText[activeCol] ?? pivotConfig.groupByBinSize[activeCol] ?? ''}
            onChange={(e) => onBinSizeInputChange(activeCol, e.target.value)}
            onBlur={() => onBinSizeBlur(activeCol)}
            slotProps={{ htmlInput: { min: 0, step: 'any' } }}
          />
        </MenuItem>
      )}
    </>
  );
}

function TopNOptions({
  activeCol,
  pivotConfig,
  topNInputText,
  isFirstOrOnlyGroupField,
  onSetGroupByTopNEnabled,
  onSetGroupByTopNInputChange,
  onTopNSizeBlur,
  setGroupByTopNGlobal,
}: {
  activeCol: string;
  pivotConfig: PivotConfig;
  topNInputText: Record<string, string>;
  isFirstOrOnlyGroupField: boolean;
  onSetGroupByTopNEnabled: (col: string, enabled: boolean) => void;
  onSetGroupByTopNInputChange: (col: string, rawValue: string) => void;
  onTopNSizeBlur: (col: string) => void;
  setGroupByTopNGlobal: (col: string, isGlobal: boolean) => void;
}) {
  const topNEnabled = pivotConfig.groupByTopNSize[activeCol] !== undefined;

  const [infoAnchorEl, setInfoAnchorEl] = useState<HTMLElement | null>(null);
  const isInfoOpen = Boolean(infoAnchorEl);

  function handleInfoOpen(event: React.MouseEvent<HTMLElement>) {
    setInfoAnchorEl(event.currentTarget);
  }
  function handleInfoClose() {
    setInfoAnchorEl(null);
  }

  return (
    <>
      <MenuItem>
        <FormGroup>
          <FormControlLabel
            sx={{ mr: 0, p: 0 }}
            control={
              <Checkbox
                size="small"
                checked={topNEnabled}
                onChange={(e) => onSetGroupByTopNEnabled(activeCol, e.target.checked)}
              />
            }
            label={<Typography variant="body2">Group into top N</Typography>}
          />
        </FormGroup>
      </MenuItem>

      {topNEnabled && (
        <MenuItem
          onClick={(e) => e.stopPropagation()}
          disableRipple
          sx={{
            display: 'flex',
            flexDirection: 'column',
            '&:hover': { backgroundColor: 'transparent', cursor: 'default' },
          }}
        >
          <TextField
            type="number"
            label="Top N size"
            size="small"
            sx={{ width: 120, mt: 0.5, mb: 1.5 }}
            value={topNInputText[activeCol] ?? pivotConfig.groupByTopNSize[activeCol] ?? ''}
            onChange={(e) => onSetGroupByTopNInputChange(activeCol, e.target.value)}
            onBlur={() => onTopNSizeBlur(activeCol)}
            slotProps={{ htmlInput: { min: 0, step: 'any' } }}
          />

          <Popover
            open={isInfoOpen}
            anchorEl={infoAnchorEl}
            onClose={handleInfoClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: { sx: { p: 2, maxWidth: 320, boxShadow: 3, borderRadius: 2 } },
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}
            >
              Calculation level
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <b>Global:</b> Top-N groups are calculated across the entire input dataset.
            </Typography>
            <Typography variant="body2">
              <b>Per group:</b> Top-N groups are calculated separately within each parent group.
              This option is only available if the field is not the first or only group-by field.
            </Typography>
          </Popover>

          <FormControl>
            <FormLabel sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <Typography variant="body2">Calculation level</Typography>
              <IconButton onClick={handleInfoOpen} size="small" sx={{ p: 0.25 }}>
                <InfoOutlined sx={{ fontSize: 16 }} />
              </IconButton>
            </FormLabel>
            <RadioGroup
              value={String(pivotConfig.groupByTopNGlobal[activeCol])}
              onChange={(e) => setGroupByTopNGlobal(activeCol, e.target.value === 'true')}
            >
              <FormControlLabel
                value="true"
                control={<Radio size="small" sx={{ py: 0.5 }} />}
                label={<Typography variant="body2">Global</Typography>}
              />
              <FormControlLabel
                value="false"
                control={<Radio size="small" sx={{ py: 0.5 }} />}
                disabled={isFirstOrOnlyGroupField}
                label={
                  <Typography
                    variant="body2"
                    color={isFirstOrOnlyGroupField ? 'text.disabled' : 'text.primary'}
                  >
                    Per group
                  </Typography>
                }
              />
            </RadioGroup>
          </FormControl>
        </MenuItem>
      )}
    </>
  );
}

interface GroupByFieldMenuProps {
  anchorEl: HTMLElement | null;
  activeCol: string | null;
  fieldType?: FieldTypes;
  pivotConfig: PivotConfig;
  binSizeInputText: Record<string, string>;
  topNInputText: Record<string, string>;
  onClose: () => void;
  onRemoveGroupByField: (col: string) => void;
  onSetGroupByGranularity: (col: string, granularity: DateGranularity) => void;
  onSetBinningEnabled: (col: string, enabled: boolean) => void;
  onBinSizeInputChange: (col: string, rawValue: string) => void;
  onBinSizeBlur: (col: string) => void;
  onSetGroupByTopNEnabled: (col: string, enabled: boolean) => void;
  onSetGroupByTopNInputChange: (col: string, rawValue: string) => void;
  onTopNSizeBlur: (col: string) => void;
  setGroupByTopNGlobal: (col: string, isGlobal: boolean) => void;
}

export function GroupByFieldMenu({
  anchorEl,
  activeCol,
  fieldType,
  pivotConfig,
  binSizeInputText,
  topNInputText,
  onClose,
  onRemoveGroupByField,
  onSetGroupByGranularity,
  onSetBinningEnabled,
  onBinSizeInputChange,
  onBinSizeBlur,
  onSetGroupByTopNEnabled,
  onSetGroupByTopNInputChange,
  onTopNSizeBlur,
  setGroupByTopNGlobal,
}: GroupByFieldMenuProps) {
  if (!activeCol) return null;

  const isFirstOrOnlyGroupField =
    pivotConfig.groupByFields.length === 1 || activeCol === pivotConfig.groupByFields[0];

  return (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose} {...menuAnchorProps}>
      {fieldType === FieldTypes.DATE && (
        <DateGranularityOptions
          activeCol={activeCol}
          pivotConfig={pivotConfig}
          onSetGroupByGranularity={onSetGroupByGranularity}
        />
      )}

      {(fieldType === FieldTypes.NUMBER || fieldType === FieldTypes.DOUBLE) && (
        <NumberBinningOptions
          activeCol={activeCol}
          pivotConfig={pivotConfig}
          binSizeInputText={binSizeInputText}
          onSetBinningEnabled={onSetBinningEnabled}
          onBinSizeInputChange={onBinSizeInputChange}
          onBinSizeBlur={onBinSizeBlur}
        />
      )}

      {fieldType !== FieldTypes.BOOLEAN && (
        <TopNOptions
          activeCol={activeCol}
          pivotConfig={pivotConfig}
          topNInputText={topNInputText}
          isFirstOrOnlyGroupField={isFirstOrOnlyGroupField}
          onSetGroupByTopNEnabled={onSetGroupByTopNEnabled}
          onSetGroupByTopNInputChange={onSetGroupByTopNInputChange}
          onTopNSizeBlur={onTopNSizeBlur}
          setGroupByTopNGlobal={setGroupByTopNGlobal}
        />
      )}

      {fieldType === FieldTypes.BOOLEAN && (
        <MenuItem disabled>
          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
            No options available for this field
          </Typography>
        </MenuItem>
      )}

      <Divider />

      <MenuItem
        onClick={() => {
          onRemoveGroupByField(activeCol);
          onClose();
        }}
        sx={{ color: Theme.SecondaryRed }}
      >
        <DeleteOutline fontSize="small" sx={{ mr: 1 }} />
        <Typography variant="body2">Remove from table</Typography>
      </MenuItem>
    </Menu>
  );
}
