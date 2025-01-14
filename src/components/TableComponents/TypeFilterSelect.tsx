import React from 'react';
import './TypeFilterSelect.css';
import {
  FormControl,
  Select,
  MenuItem,
  Typography,
  InputAdornment,
  IconButton, SelectChangeEvent,
} from '@mui/material';
import { Clear } from '@mui/icons-material';

type TypeFilterSelectProps = {
  selectedValue: string | null;
  onTypeFilterChange: (e:SelectChangeEvent<string | null>) => void;
  onTypeFilterClear: () => void;
  allTypes: string[];
};

function TypeFilterSelect(props: TypeFilterSelectProps) {
  const { selectedValue, onTypeFilterChange, onTypeFilterClear, allTypes } = props;
  return (
    <FormControl size="small" className="form-control">
      <Select
        value={selectedValue || ''}
        onChange={(e) => onTypeFilterChange(e)}
        size="small"
        variant="outlined"
        displayEmpty
        className="select"
        renderValue={(selected) =>
          (selected ? (
            <em style={{ fontSize: '.9em' }}>{selected}</em>
          ) : (
            <Typography color="textDisabled" variant="subtitle2">
              Filter by Type
            </Typography>
          ))}
        endAdornment={
                    selectedValue && (
                    <InputAdornment position="end" style={{ marginRight: '0.5rem' }}>
                      <IconButton onClick={onTypeFilterClear} size="small">
                        <Clear fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                    )
                }
      >
        {allTypes.map((option) => (
          <MenuItem key={option} value={option} style={{ fontSize: '0.9em' }}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default TypeFilterSelect;
