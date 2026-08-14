import { InfoOutlined } from '@mui/icons-material';
import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  Popover,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import type { PivotConfig } from '../dataSummariesMeta';

interface Option {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

function OptionCheckboxItem({ option }: { option: Option }) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <FormControlLabel
        sx={{ my: -0.5, mx: 0.25 }}
        control={
          <Checkbox
            size="small"
            checked={option.checked}
            onChange={(e) => option.onChange(e.target.checked)}
          />
        }
        label={
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="body2">{option.label}</Typography>
            {option.description && (
              <IconButton size="small" onClick={handleOpenPopover} sx={{ p: 0.25 }}>
                <InfoOutlined sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </Stack>
        }
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        slotProps={{
          paper: {
            sx: { p: 1.5, maxWidth: 280 },
          },
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
          {option.label}
        </Typography>
        <Typography variant="body2">{option.description}</Typography>
      </Popover>
    </>
  );
}

interface TableMenuProps {
  pivotConfig: PivotConfig;
  setPivotConfig: React.Dispatch<React.SetStateAction<PivotConfig>>;
}

export function TableMenu({ pivotConfig, setPivotConfig }: TableMenuProps) {
  function handleShowTotalCountFooterChange(show: boolean) {
    setPivotConfig((prev) => ({
      ...prev,
      showTotalCountFooter: show,
    }));
  }

  function onShowRelativePercentagesChange(show: boolean) {
    setPivotConfig((prev) => ({
      ...prev,
      showRelativePercentages: show,
    }));
  }

  function onHideEmptyNullGroupsChange(hide: boolean) {
    setPivotConfig((prev) => ({
      ...prev,
      hideEmptyNullGroups: hide,
    }));
  }
  const options: Option[] = [
    {
      id: 'showTotalCountFooter',
      label: 'Show total count footer',
      checked: pivotConfig.showTotalCountFooter,
      onChange: handleShowTotalCountFooterChange,
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
    <>
      <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 'bold' }}>
        Global options
      </Typography>
      <FormGroup sx={{ alignItems: 'flex-start', mb: 1.5 }}>
        {options.map((opt) => (
          <OptionCheckboxItem key={opt.id} option={opt} />
        ))}
      </FormGroup>
    </>
  );
}
