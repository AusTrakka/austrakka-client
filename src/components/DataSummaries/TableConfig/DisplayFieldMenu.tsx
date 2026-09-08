import { DeleteOutline } from '@mui/icons-material';
import { Checkbox, Divider, Menu, MenuItem, Typography } from '@mui/material';
import type { Dispatch, SetStateAction } from 'react';
import { Theme } from '../../../assets/themes/theme';
import type { FieldTypes } from '../../../constants/fieldTypes';
import type { PivotConfig } from '../dataSummariesMeta';
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
  setPivotConfig: Dispatch<SetStateAction<PivotConfig>>;
}

export function DisplayFieldMenu({
  anchorEl,
  activeCol,
  fieldType,
  selectedAggregations,
  onClose,
  setPivotConfig,
}: DisplayFieldMenuProps) {
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
  const availableAggregations = fieldType ? (FIELD_TYPE_AGGREGATION_TYPES[fieldType] ?? []) : [];

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl && activeCol)}
      onClose={onClose}
      {...menuAnchorProps}
    >
      <Typography
        variant="caption"
        sx={{ px: 2, py: 0.5, color: Theme.PrimaryGrey500, display: 'block' }}
      >
        Aggregations
      </Typography>

      {availableAggregations.length === 0 ? (
        <MenuItem disabled>
          <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
            No options available for this field
          </Typography>
        </MenuItem>
      ) : (
        availableAggregations.map((agg) => {
          const isSelected = selectedAggregations.includes(agg);
          return (
            <MenuItem key={agg} onClick={() => toggleAggregation(activeCol!, agg)}>
              <Checkbox size="small" checked={isSelected} sx={{ mr: 1, p: 0 }} disableRipple />
              <Typography variant="body2">{AGG_TYPE_LABELS[agg]}</Typography>
            </MenuItem>
          );
        })
      )}
      <Divider />
      <MenuItem
        onClick={() => {
          handleRemoveDisplayField(activeCol!);
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
