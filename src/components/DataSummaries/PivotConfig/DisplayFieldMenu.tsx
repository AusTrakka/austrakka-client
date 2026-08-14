import { DeleteOutline } from '@mui/icons-material';
import { Checkbox, Divider, Menu, MenuItem, Typography } from '@mui/material';
import { Theme } from '../../../assets/themes/theme';
import type FieldTypes from '../../../constants/fieldTypes';
import {
  AGG_TYPE_LABELS,
  type AggregationType,
  FIELD_TYPE_AGGREGATION_TYPES,
} from '../dataSummariesMeta';

const menuAnchorProps = {
  anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
  transformOrigin: { vertical: 'top', horizontal: 'right' },
} as const;

interface DisplayFieldMenuProps {
  anchorEl: HTMLElement | null;
  activeCol: string | null;
  fieldType?: FieldTypes;
  selectedAggregations: AggregationType[];
  onClose: () => void;
  onToggleAggregation: (col: string, agg: AggregationType) => void;
  onRemoveDisplayField: (col: string) => void;
}

export function DisplayFieldMenu({
  anchorEl,
  activeCol,
  fieldType,
  selectedAggregations,
  onClose,
  onToggleAggregation,
  onRemoveDisplayField,
}: DisplayFieldMenuProps) {
  if (!activeCol) return null;

  const availableAggs = fieldType ? (FIELD_TYPE_AGGREGATION_TYPES[fieldType] ?? []) : [];

  return (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose} {...menuAnchorProps}>
      <Typography
        variant="caption"
        sx={{ px: 2, py: 0.5, color: Theme.PrimaryGrey500, display: 'block' }}
      >
        Aggregations
      </Typography>

      {availableAggs.length === 0 ? (
        <MenuItem disabled>
          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
            No options available for this field
          </Typography>
        </MenuItem>
      ) : (
        availableAggs.map((agg) => {
          const isSelected = selectedAggregations.includes(agg);
          return (
            <MenuItem key={agg} onClick={() => onToggleAggregation(activeCol, agg)}>
              <Checkbox size="small" checked={isSelected} sx={{ mr: 1, p: 0 }} />
              <Typography variant="body2">{AGG_TYPE_LABELS[agg]}</Typography>
            </MenuItem>
          );
        })
      )}
      <Divider />
      <MenuItem
        onClick={() => {
          onRemoveDisplayField(activeCol);
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
