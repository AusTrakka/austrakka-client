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
    minRows={multiline ? 1 : undefined}
    maxRows={multiline ? 10 : undefined}
    hiddenLabel
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    sx={{
      '& .MuiFilledInput-root': {
        paddingLeft: '12px',
        paddingRight: '8px',
        paddingTop: '6px',
        paddingBottom: '6px',
        ...(multiline && {
          display: 'flex',
          alignItems: 'stretch',
          resize: 'vertical',
          overflow: 'auto',
          minHeight: '30px',
        }),
      },
      '& .MuiInputBase-input': {
        resize: 'none',
        flex: 1,
        height: '100%',
        boxSizing: 'border-box',
        paddingLeft: '0px !important', // Removes the extra left indent
        paddingRight: '0px !important',
        paddingTop: '0px !important',
        paddingBottom: '0px !important',
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
              '& .MuiTypography-root': { fontSize: '0.75rem !important', color: 'text.secondary' },
            }}
          >
            {`${value?.length ?? 0}/${maxLength}`}
          </InputAdornment>
        ),
      },
    }}
  />
);
