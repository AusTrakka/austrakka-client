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

interface Option {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

function OptionCheckboxItem({ option }: { option: Option }) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleOpenPopover = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

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

export function TableOptions({ options }: { options: Option[] }) {
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
