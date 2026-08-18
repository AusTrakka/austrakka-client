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
import { type Dispatch, type MouseEvent, type SetStateAction, useState } from 'react';
import { Theme } from '../../../assets/themes/theme';
import FieldTypes from '../../../constants/fieldTypes';
import { computeSuggestedBinSize } from '../../../utilities/dataSummariesUtils';
import {
  DATE_GRANULARITY_LABELS,
  DateGranularity,
  type PivotConfig,
  type RowRecord,
} from '../dataSummariesMeta';

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

      {DATE_GRANULARITY_OPTIONS.map((option) => {
        const isSelected = selectedValue === option;
        return (
          <MenuItem
            key={option}
            selected={isSelected}
            onClick={() => {
              onSetGroupByGranularity(activeCol, option);
            }}
          >
            <Radio checked={isSelected} size="small" sx={{ mr: 1.5, p: 0 }} />
            <Typography variant="body2">{DATE_GRANULARITY_LABELS[option]}</Typography>
          </MenuItem>
        );
      })}
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

  function handleInfoOpen(event: MouseEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
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
  setPivotConfig: Dispatch<SetStateAction<PivotConfig>>;
  anchorEl: HTMLElement | null;
  activeCol: string | null;
  fieldType?: FieldTypes;
  pivotConfig: PivotConfig;
  onClose: () => void;
  rows: RowRecord[];
}

export function GroupByFieldMenu({
  anchorEl,
  activeCol,
  fieldType,
  pivotConfig,
  rows,
  onClose,
  setPivotConfig,
}: GroupByFieldMenuProps) {
  const [binSizeInputText, setBinSizeInputText] = useState<Record<string, string>>({});
  const [topNInputText, setTopNInputText] = useState<Record<string, string>>({});

  const isFirstOrOnlyGroupField =
    pivotConfig.groupByFields.length === 1 || activeCol === pivotConfig.groupByFields[0];

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

  function handleSetGroupByTopNGlobal(col: string, isGlobal: boolean) {
    setPivotConfig((prev) => {
      const nextTopNGlobal = { ...prev.groupByTopNGlobal };
      nextTopNGlobal[col] = isGlobal;
      return { ...prev, groupByTopNGlobal: nextTopNGlobal };
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

  function setGroupByGranularity(col: string, granularity: DateGranularity) {
    setPivotConfig((prev) => ({
      ...prev,
      groupByGranularity: {
        ...prev.groupByGranularity,
        [col]: granularity,
      },
    }));
  }

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

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl && activeCol)}
      onClose={onClose}
      {...menuAnchorProps}
    >
      {fieldType === FieldTypes.DATE && (
        <DateGranularityOptions
          activeCol={activeCol!}
          pivotConfig={pivotConfig}
          onSetGroupByGranularity={setGroupByGranularity}
        />
      )}

      {(fieldType === FieldTypes.NUMBER || fieldType === FieldTypes.DOUBLE) && (
        <NumberBinningOptions
          activeCol={activeCol!}
          pivotConfig={pivotConfig}
          binSizeInputText={binSizeInputText}
          onSetBinningEnabled={setBinningEnabled}
          onBinSizeInputChange={handleBinSizeInputChange}
          onBinSizeBlur={handleBinSizeBlur}
        />
      )}

      {fieldType !== FieldTypes.BOOLEAN && fieldType !== undefined && (
        <TopNOptions
          key={activeCol}
          activeCol={activeCol!}
          pivotConfig={pivotConfig}
          topNInputText={topNInputText}
          isFirstOrOnlyGroupField={isFirstOrOnlyGroupField}
          onSetGroupByTopNEnabled={setGroupByTopNEnabled}
          onSetGroupByTopNInputChange={handleGroupByTopNInputChange}
          onTopNSizeBlur={handleTopNBlur}
          setGroupByTopNGlobal={handleSetGroupByTopNGlobal}
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
          handleRemoveGroupByField(activeCol!);
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
