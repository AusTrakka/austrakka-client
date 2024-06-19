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
    console.log("what key", e.key);
    if (e.key === 'Enter') {
      e.preventDefault();
      console.log("Enter was pressed some might say")
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
    console.log("what key", e.key);
    if (e.key === 'Enter') {
      console.log("Enter was pressed some might say")
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
      fullWidth
    />
  );
}

export { TextEditable, NumericEditable };
