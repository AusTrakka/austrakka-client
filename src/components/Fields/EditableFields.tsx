import React, { useState, useEffect } from 'react';
import { TextField } from '@mui/material';

function TextEditable({ value, editorCallback }:
{ value: string, editorCallback: (newValue: any) => void }) {
  const [internalValue, setInternalValue] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
  };

  const handleBlur = () => {
    editorCallback(internalValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      editorCallback(internalValue);
    }
  };

  // Keep the internal state in sync with the value prop
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  return (
    <TextField
      type="text"
      value={internalValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      size="small"
      color="secondary"
      variant="filled"
      multiline
      minRows={1}
      maxRows={3}
      fullWidth
      slotProps={{
        input: {
          sx: {
            fontSize: '0.9rem',
            padding: '10px',
            width: '100%',
            boxSizing: 'border-box',
          },
        },
      }}
      sx={{
        '& .MuiInputBase-root': {
          width: '100%',
          fontSize: '0.9rem',
        },
      }}
    />
  );
}

function NumericEditable({ value, editorCallback }:
{ value: string, editorCallback: (newValue: any) => void }) {
  const [internalValue, setInternalValue] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
  };

  const handleBlur = () => {
    editorCallback(internalValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      editorCallback(internalValue);
    }
  };

  // Keep the internal state in sync with the value prop
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  return (
    <TextField
      type="number"
      value={internalValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      variant="standard"
      size="small"
      fullWidth
      slotProps={{
        htmlInput: {
          inputMode: 'numeric',
        },
        input: {
          sx: {
            fontSize: '0.9rem',
            paddingY: '4px',
            height: '1.8rem',
            boxSizing: 'border-box',
            width: '100%',
          },
        },
      }}
      sx={{
        '& .MuiInputBase-root': {
          fontSize: '0.9rem',
          lineHeight: 1.2,
          maxHeight: '28px',
          width: '100%',
        },
      }}
    />
  );
}

export { TextEditable, NumericEditable };
