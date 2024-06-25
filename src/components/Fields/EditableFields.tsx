import React, { useState, useEffect } from 'react';
import { TextField } from '@mui/material';

function TextEditable({ value, editorCallback }:
{ value: string, editorCallback: (newValue: string) => void }) {
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

  // Keep internal state in sync with the value prop
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
      variant="outlined"
      multiline
      fullWidth
    />
  );
}

function NumericEditable({ value, editorCallback }:
{ value: string, editorCallback: (newValue: string) => void }) {
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

  // Keep internal state in sync with the value prop
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
      size="small"
      variant="outlined"
      fullWidth
    />
  );
}

export { TextEditable, NumericEditable };
