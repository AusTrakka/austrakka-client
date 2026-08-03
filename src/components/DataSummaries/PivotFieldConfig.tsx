import { Cancel, QuestionMark } from '@mui/icons-material';
import {
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  FormGroup,
  Icon,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { createElement } from 'react';
import { Theme } from '../../assets/themes/theme';
import FieldTypes from '../../constants/fieldTypes';
import { FIELD_TYPE_COLOURS, FIELD_TYPE_ICONS } from '../Fields/fieldsMeta';
import {
  AGG_TYPE_LABELS,
  type AggregationType,
  DATE_GRANULARITY_LABELS,
  DateGranularity,
  FIELD_TYPE_AGGREGATION_TYPES,
  type FieldTypeMap,
  type PivotConfig,
} from './dataSummariesMeta';

const DATE_GRANULARITY_OPTIONS = Object.values(DateGranularity);

interface PivotFieldConfigProps {
  pivotConfig: PivotConfig;
  fieldTypes: FieldTypeMap;
  fieldLabelByKey: Record<string, string>;
  binSizeInputText: Record<string, string>;
  onRemoveGroupByField: (col: string) => void;
  onRemoveDisplayField: (col: string) => void;
  onSetGroupByGranularity: (col: string, granularity: DateGranularity) => void;
  onSetBinningEnabled: (col: string, enabled: boolean) => void;
  onBinSizeInputChange: (col: string, rawValue: string) => void;
  onBinSizeBlur: (col: string) => void;
  onToggleAggregation: (col: string, agg: AggregationType) => void;
}

// Field icon + type tooltip
function FieldTypeIndicator({ fieldType }: { fieldType: FieldTypes }) {
  const FieldIcon = FIELD_TYPE_ICONS[fieldType];

  if (!FieldIcon) {
    return (
      <Tooltip title="Unknown field type" arrow placement="left">
        <QuestionMark fontSize="small" sx={{ color: Theme.PrimaryGrey500 }} />
      </Tooltip>
    );
  }

  return (
    <Tooltip title={`Field type: ${fieldType}`} arrow placement="left">
      <Icon
        sx={{
          color: FIELD_TYPE_COLOURS[fieldType] ?? Theme.PrimaryGrey500,
          '&:hover': { opacity: 0.6 },
          transition: 'opacity 0.15s ease',
        }}
      >
        {createElement(FieldIcon, { fontSize: 'small' })}
      </Icon>
    </Tooltip>
  );
}

function RemoveFieldButton({ onClick }: { onClick: () => void }) {
  return (
    <Tooltip title="Remove field from the table" arrow placement="left">
      <IconButton sx={{ p: 0 }} size="small" onClick={onClick}>
        <Cancel fontSize="small" sx={{ color: Theme.PrimaryGrey400 }} />
      </IconButton>
    </Tooltip>
  );
}

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
  } = props;

  return (
    <Box sx={{ p: 2, minWidth: 320, maxWidth: 480 }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold' }}>
        Group-by fields
      </Typography>
      {pivotConfig.groupByFields.length === 0 ? (
        <Typography variant="body2" sx={{ color: Theme.PrimaryGrey500 }}>
          No group-by fields selected
        </Typography>
      ) : (
        <Stack spacing={1}>
          {pivotConfig.groupByFields.map((col) => {
            const isDateField = fieldTypes[col] === FieldTypes.DATE;
            const isNumberField =
              fieldTypes[col] === FieldTypes.NUMBER || fieldTypes[col] === FieldTypes.DOUBLE;
            const currentGranularity = pivotConfig.groupByGranularity[col] ?? DateGranularity.Month;
            const binningEnabled = pivotConfig.groupByBinSize[col] !== undefined;

            return (
              <Box key={col} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    minWidth: 160,
                    flexShrink: 0,
                  }}
                >
                  <RemoveFieldButton onClick={() => onRemoveGroupByField(col)} />
                  <FieldTypeIndicator fieldType={fieldTypes[col]} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {fieldLabelByKey[col] ?? col}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, flex: 1 }}>
                  {isDateField &&
                    DATE_GRANULARITY_OPTIONS.map((option) => (
                      <Chip
                        key={option}
                        label={DATE_GRANULARITY_LABELS[option]}
                        size="small"
                        color="primary"
                        variant={currentGranularity === option ? 'filled' : 'outlined'}
                        onClick={() => onSetGroupByGranularity(col, option)}
                      />
                    ))}

                  {isNumberField && (
                    <>
                      <FormGroup>
                        <FormControlLabel
                          sx={{ mr: 0, p: 0 }}
                          control={
                            <Checkbox
                              size="small"
                              checked={binningEnabled}
                              onChange={(e) => onSetBinningEnabled(col, e.target.checked)}
                            />
                          }
                          label={<Typography variant="body2">Group into bins</Typography>}
                        />
                      </FormGroup>
                      {binningEnabled && (
                        <TextField
                          type="number"
                          label="Bin size"
                          size="small"
                          sx={{ width: 100 }}
                          value={binSizeInputText[col] ?? pivotConfig.groupByBinSize[col] ?? ''}
                          onChange={(e) => onBinSizeInputChange(col, e.target.value)}
                          onBlur={() => onBinSizeBlur(col)}
                          slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                        />
                      )}
                    </>
                  )}

                  {!isDateField && !isNumberField && (
                    <Typography
                      variant="body2"
                      sx={{ color: Theme.PrimaryGrey500, fontStyle: 'italic' }}
                    >
                      No options for this field
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Stack>
      )}

      <Typography variant="subtitle2" sx={{ mt: 3, mb: 1.5, fontWeight: 'bold' }}>
        Display fields
      </Typography>
      {pivotConfig.displayFields.length === 0 ? (
        <Typography variant="body2" sx={{ color: Theme.PrimaryGrey500 }}>
          No display fields selected
        </Typography>
      ) : (
        <Stack spacing={3}>
          {pivotConfig.displayFields.map((col) => {
            const allowed = FIELD_TYPE_AGGREGATION_TYPES[fieldTypes[col]] ?? [];
            const selectedAggs = pivotConfig.selectedAggregations[col] ?? [];

            return (
              <Box key={col} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    minWidth: 160,
                    flexShrink: 0,
                  }}
                >
                  <RemoveFieldButton onClick={() => onRemoveDisplayField(col)} />
                  <FieldTypeIndicator fieldType={fieldTypes[col]} />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {fieldLabelByKey[col] ?? col}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, flex: 1 }}>
                  {allowed.map((agg) => {
                    const isSelected = selectedAggs.includes(agg);
                    return (
                      <Chip
                        key={agg}
                        label={AGG_TYPE_LABELS[agg]}
                        size="small"
                        color="primary"
                        variant={isSelected ? 'filled' : 'outlined'}
                        onClick={() => onToggleAggregation(col, agg)}
                      />
                    );
                  })}
                </Box>
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

export default PivotFieldConfig;
