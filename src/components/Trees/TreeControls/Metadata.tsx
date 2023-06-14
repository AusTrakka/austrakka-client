import React from 'react';
import { Theme, useTheme } from '@mui/material/styles';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function getStyles(column: string, selectedColumns: string[], theme: Theme) {
  return {
    fontWeight:
      selectedColumns.indexOf(column) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}

export default function MetadataColumnSelect(
  { columns, onChange }: { columns: string[], onChange: CallableFunction },
) {
  const theme = useTheme();
  const [selectedColumns, setSelectedColumns] = React.useState<string[]>([]);

  const handleChange = (event: SelectChangeEvent<typeof selectedColumns>) => {
    const {
      target: { value },
    } = event;
    setSelectedColumns(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value,
    );
    onChange(value);
  };

  return (
    <div>
      <FormControl sx={{ m: 1, width: 300 }}>
        <InputLabel id="multiple-name-label">Column</InputLabel>
        <Select
          labelId="multiple-name-label"
          id="multiple-name"
          multiple
          value={selectedColumns}
          onChange={handleChange}
          input={<OutlinedInput label="Column" />}
          MenuProps={MenuProps}
        >
          {columns.map((column) => (
            <MenuItem
              key={column}
              value={column}
              style={getStyles(column, selectedColumns, theme)}
            >
              {column}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}
