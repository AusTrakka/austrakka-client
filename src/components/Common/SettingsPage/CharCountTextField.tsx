import { InputAdornment, TextField } from '@mui/material';

interface CharCountedTextFieldProps {
  value: string | null | undefined;
  maxLength: number;
  multiline?: boolean;
  onChange: (value: string) => void;
}

export const CharCountedTextField = ({
  value,
  maxLength,
  multiline = false,
  onChange,
}: CharCountedTextFieldProps) => (
  <TextField
    variant="filled"
    size="small"
    fullWidth
    multiline={multiline}
    rows={multiline ? 1 : undefined}
    hiddenLabel
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    sx={{
      ...(multiline && {
        '& .MuiInputBase-root': {
          display: 'flex',
          alignItems: 'stretch',
          resize: 'vertical',
          overflow: 'auto',
          minHeight: '45px',
        },
      }),
      '& .MuiInputBase-input': {
        resize: 'none',
        flex: 1,
        height: '100% !important',
        boxSizing: 'border-box',
      },
    }}
    slotProps={{
      htmlInput: {
        maxLength,
      },
      input: {
        endAdornment: (
          <InputAdornment
            position="end"
            sx={{
              alignSelf: 'center',
              margin: 0,
              pl: 1,
              '& .MuiTypography-root': { fontSize: '0.75rem', color: 'text.secondary' },
            }}
          >
            {`${value?.length ?? 0}/${maxLength}`}
          </InputAdornment>
        ),
      },
    }}
  />
);
