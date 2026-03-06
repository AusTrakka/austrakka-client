import React, { Dispatch, SetStateAction } from 'react';
import { Box, Grid2 as Grid, Button, Stack, TextField, InputAdornment, IconButton, Tooltip } from '@mui/material';
import { AddBox, IndeterminateCheckBox, Lock } from '@mui/icons-material';
import { ClearIcon, DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { supportedColumns } from './ActivityTableFields';

export type Filters = {
  resourceUniqueString?: string | null;
  resourceType?: string | null;
  eventType?: string | null;
  submitterDisplayName?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
};

interface FilterTextInputProps {
  label: string | undefined;
  value: string;
  onChange: (val: string) => void;
  onClear?: () => void;
}

interface FilterDateInputProps {
  label: string | undefined;
  value: Date | null;
  onChange: (val: Date | null) => void;
}

interface ActivityFiltersProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
}

function FilterTextInput(props: FilterTextInputProps) {
  const { label, value, onChange, onClear } = props;
  return (
    <TextField
      fullWidth
      size="small"
      variant="outlined"
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      slotProps={{
        input: {
          endAdornment: value ? (
            <InputAdornment position="end">
              { label === 'Resource' && (
                <Tooltip title="Strict match only" placement="top" arrow>
                  <Lock fontSize="small" sx={{ mr: 0 }} />
                </Tooltip>
                
              )}
              <IconButton onClick={onClear} edge="end" size="small">
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
          style: { lineHeight: 1.5, height: 'auto', alignItems: 'center', display: 'flex' },
        },
      }}
      sx={{ 'alignItems': 'center', 'display': 'flex', '& .MuiInputBase-input': { flex: 1, minWidth: 0 } }}
    />
  );
}

function FilterDateInput(props: FilterDateInputProps) {
  const { label, value, onChange } = props;
  const calculateDateValue = (date: Date | null) => {
    if (label === 'To date') {
      return date ? dayjs(date).endOf('day').toDate() : null;
    } if (label === 'From date') {
      return date ? dayjs(date).startOf('day').toDate() : null;
    }
    return null;
  };
    
  return (
    <Box sx={{ minWidth: 170, maxWidth: 180, flex: 1 }}>
      <DatePicker
        label={label}
        value={value ? dayjs(value) : null}
        onChange={(newValue) => {
          onChange(
            newValue ? calculateDateValue(newValue.toDate()) : null,
          );
        }}
        slotProps={{
          textField: {
            fullWidth: true,
            size: 'small',
            variant: 'outlined',
            sx: {
              '& .MuiInputBase-input': {
                flex: 1,
                minWidth: 0,
              },
              '& .MuiInputAdornment-root': {
                marginLeft: 0,
              },
            },
          },
          field: { clearable: true, onClear: () => onChange(null) },
        }}
        disableFuture
      />
    </Box>
  );
}

function ActivityFilters(props: ActivityFiltersProps) {
  const { isOpen, setIsOpen, filters, setFilters } = props;

  const handleFilterChange = (field: keyof Filters, value: string | Date | null) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFilterClear = () => {
    setFilters({
      resourceUniqueString: null,
      resourceType: null,
      eventType: null,
      submitterDisplayName: null,
      startDate: null,
      endDate: null,
    });
  };

  const getFilterValueString = (val: unknown) => {
    if (typeof val === 'string') return val;
    if (val instanceof Date) return val.toISOString();
    return '';
  };

  return (
    <Box
      sx={{
        boxShadow: 1, borderRadius: 1, padding: 1, marginBottom: 2, backgroundColor: 'white', minWidth: '200px',
      }}
    >
      <Grid container direction="column" width="100%">
        <Button onClick={() => setIsOpen(!isOpen)} sx={{ textTransform: 'none' }}>
          <Grid container width="100%" justifyContent="space-between">
            <Stack direction="row" alignItems="center" gap={1}>
              {isOpen ? <IndeterminateCheckBox /> : <AddBox />}
              <Box sx={{ fontWeight: 'bold' }}>Filters</Box>
            </Stack>
          </Grid>
        </Button>
      </Grid>
      <Grid container>
        {isOpen ? (
          <Box display="flex" gap={1} flexWrap="wrap" justifyContent="flex-start">
            {supportedColumns
              .filter((column) => column.columnName !== 'eventTime')
              .map((column) => {
                const value = getFilterValueString(filters[column.columnName as keyof Filters] ?? '');
                return (
                  <Box key={column.columnName} sx={{ minWidth: 170, maxWidth: 180, flex: '1 1 180px' }}>
                    <FilterTextInput
                      label={column.headerName}
                      value={value}
                      onChange={(val) => handleFilterChange(
                        column.columnName as keyof Filters,
                        val,
                      )}
                      onClear={() => handleFilterChange(column.columnName as keyof Filters, null)}
                    />
                  </Box>
                );
              })}
            <FilterDateInput
              label="From date"
              value={filters?.startDate ?? null}
              onChange={(val) => handleFilterChange('startDate', val)}
            />
            <FilterDateInput
              label="To date"
              value={filters?.endDate ?? null}
              onChange={(val) => handleFilterChange('endDate', val)}
            />
            {(Object.values(filters).some((val) => val !== null && val !== '')) ? (
              <Box sx={{ minWidth: 140, flex: '0 0 140px', display: 'flex', alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  sx={{ textTransform: 'none', width: '100%' }}
                  onClick={() => handleFilterClear()}
                >
                  Clear filters
                </Button>
              </Box>
            ) : null}
          </Box>
        ) : null}
      </Grid>
    </Box>
  );
}

export default ActivityFilters;
