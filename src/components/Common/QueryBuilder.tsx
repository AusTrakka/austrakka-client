import React, { useEffect, useState } from 'react';
import {
  Select, MenuItem, Box, FormControl,
  InputLabel, Button, TextField, IconButton,
  Chip, Snackbar, Alert, keyframes, SelectChangeEvent,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CloseIcon from '@mui/icons-material/Close';
import {
  AddBox, IndeterminateCheckBox, AddCircle,
} from '@mui/icons-material';
import { DisplayFields } from '../../types/fields.interface';

export interface Filter {
  shakeElement?: boolean,
  field: string,
  fieldType: string,
  condition: string,
  value: any
}

interface QueryBuilderProps {
  isOpen: boolean,
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setQueryString: React.Dispatch<React.SetStateAction<string>>,
  fieldList: DisplayFields[], // Get field list from columns rendered in the table
  filterList: Filter[],
  setFilterList: React.Dispatch<React.SetStateAction<Filter[]>>,
  totalSamples: number;
  samplesCount: number;
}
const shake = keyframes`
  0% { transform: translateY(0) }
  25% { transform: translateY(5px) }
  50% { transform: translateY(-5px) }
  75% { transform: translateY(5px) }
  100% { transform: translateY(0) }
`;

function QueryBuilder(props: QueryBuilderProps) {
  const {
    isOpen,
    setIsOpen,
    setQueryString,
    fieldList,
    filterList,
    setFilterList,
    totalSamples,
    samplesCount,
  } = props;

  const initialFilterState = {
    field: '',
    condition: '',
    value: '',
    fieldType: '',
    shakeElement: false,
  };
  const stringConditions = [
    { key: '@=*', value: '@=*', name: 'Contains' },
    { key: '!@=*', value: '!@=*', name: 'Doesn\'t Contain' },
    { key: '_=*', value: '_=*', name: 'Starts With' },
    { key: '==*', value: '==*', name: 'Equals' },
    { key: '!=*', value: '!=*', name: 'Doesn\'t Equal' },
  ];
  const dateConditions = [
    { key: '==', value: '==', name: 'On' },
    { key: '<', value: '<', name: 'On and before' },
    { key: '>', value: '>', name: 'On and after' },
  ];
  const numberConditions = [
    { key: '==', value: '==', name: 'Equals' },
    { key: '!=', value: '!=', name: 'Doesn\'t equal' },
    { key: '<', value: '<', name: 'Less than' },
    { key: '>', value: '>', name: 'Greater than' },
    { key: '<=', value: '<=', name: 'Less than or equal to' },
    { key: '>=', value: '>=', name: 'Greater than or equal to' },
  ];
  const [newFilter, setNewFilter] = useState(initialFilterState);
  const [conditions, setConditions] = useState(stringConditions);
  const [showDate, setShowDate] = useState(false);
  const [filterError, setFilterError] = useState(false);
  const [filterErrorMessage, setFilterErrorMessage] = useState('An error has occured in the table filters.');

  useEffect(() => {
    if (filterList.filter(e => e.shakeElement === true).length > 0) {
      const copy = [...filterList];
      for (let i = 0; i < copy.length; i += 1) {
        copy[i].shakeElement = false;
      }
      setFilterList(copy);
    }
  }, [filterList, isOpen, setFilterList]);

  useEffect(() => {
    // Building query string
    let queryString = '';
    filterList.forEach((filter) => {
      let newString = '';
      // For date fields, build filter string in SSKV syntax
      if (filter.fieldType === 'date') {
        const date = filter.value;
        // dayStart = date and time that is selected in date picker
        // dayEnd = dayStart + 86399000ms
        const dayStart = date.$d.toISOString().split('.')[0];
        const dayEnd = (new Date((date.$d.getTime() + 86399000))).toISOString().split('.')[0];
        if (filter.condition === '==') {
          newString = `SSKV>=${filter.field}|${dayStart},SSKV<=${filter.field}|${dayEnd},`;
        } else if (filter.condition === '<') {
          newString = `SSKV${filter.condition}=${filter.field}|${dayEnd},`;
        } else if (filter.condition === '>') {
          newString = `SSKV${filter.condition}=${filter.field}|${dayStart},`;
        }
      } else {
        newString = `${filter.field + filter.condition + filter.value},`;
      }
      queryString += newString;
    });
    setQueryString(queryString.substring(0, queryString.length - 1));
  }, [filterList, setQueryString]);

  const handleFilterChange = (event: SelectChangeEvent) => {
    if (event.target.name === 'field') {
      const targetFieldProps = fieldList.find((field) => field.columnName === event.target.value);
      setNewFilter({
        ...newFilter,
        [event.target.name]: event.target.value as string,
        fieldType: targetFieldProps?.primitiveType || 'string',
        condition: '',
        value: '',
      });
      if (targetFieldProps?.primitiveType === 'date') {
        setConditions(dateConditions);
        setShowDate(true);
      } else if (targetFieldProps?.primitiveType === 'number') {
        setConditions(numberConditions);
        setShowDate(false);
      } else {
        setConditions(stringConditions);
        setShowDate(false);
      }
    } else {
      setNewFilter({
        ...newFilter,
        [event.target.name]: event.target.value as string,
      });
    }
  };
  const handleFilterDateChange = (newDate: any) => {
    setNewFilter({
      ...newFilter,
      value: newDate,
    });
  };
  const handleFilterAdd = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isEmpty = Object.values(newFilter).some((x) => x === null || x === '');
    if (!isEmpty) {
      let doesExist = false;
      for (let i = 0; i < filterList.length; i += 1) {
        const filter = filterList[i];
        if (filter.condition === newFilter.condition
          && filter.value.toString().toLowerCase() === newFilter.value.toString().toLowerCase()
          && filter.field === newFilter.field) {
          filter.shakeElement = true;
          doesExist = true;
        } else {
          filter.shakeElement = false;
        }
      }
      if (doesExist) {
        setFilterError(true);
        setFilterErrorMessage('This filter has already been applied.');
        setNewFilter(initialFilterState);
      } else {
        setFilterList((prevState) => [...prevState, newFilter]);
        setNewFilter(initialFilterState);
      }
    }
  };
  const handleFilterDelete = (filter: object) => {
    setFilterList((oldList) => oldList.filter((filterEntry) => filterEntry !== filter));
  };
  const clearFilters = () => {
    setFilterList([]);
  };
  const closeSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setFilterError(false);
  };
  const action = (
    <IconButton
      size="small"
      aria-label="close"
      color="inherit"
      onClick={closeSnackbar}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  );
  const filteredMessage = `Filtered to ${samplesCount.toLocaleString('en-US')} of ${totalSamples.toLocaleString('en-US')} records. `;
  return (
    <Box sx={{
      boxShadow: 1, borderRadius: 1, padding: 1, marginBottom: 2, display: 'flex',
    }}
    >
      <div>
        <Box sx={{ flexGrow: 1 }}>
          <Button onClick={() => setIsOpen(!isOpen)} sx={{ textTransform: 'none', fontWeight: 'bold' }}>
            {isOpen ? <IndeterminateCheckBox /> : <AddBox />}
            <Box sx={{ paddingLeft: 1 }}>Table Filters</Box>
          </Button>
        </Box>
        <Snackbar
          open={filterError}
          autoHideDuration={9000}
          message={filterErrorMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          onClose={closeSnackbar}
          action={action}
        >
          <Alert onClose={closeSnackbar} severity="error" elevation={6}>
            {filterErrorMessage}
          </Alert>
        </Snackbar>
        { isOpen
          ? (
            <Box>
              <Snackbar
                open={samplesCount === 0 && filterList.length > 0}
                autoHideDuration={3000}
                message={filterErrorMessage}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                action={action}
              >
                <Alert severity="info" elevation={6}>
                  All filter conditions must match a record for it to appear in the results.
                </Alert>
              </Snackbar>
              <form onSubmit={(event) => handleFilterAdd(event)}>
                <FormControl size="small" sx={{ m: 1, minWidth: 120 }}>
                  <InputLabel id="field-simple-select-label">Field</InputLabel>
                  <Select
                    labelId="field-simple-select-label"
                    id="field-simple-select-label"
                    label="Field"
                    name="field"
                    value={newFilter.field}
                    onChange={handleFilterChange}
                  >
                    {fieldList.map((field) => (
                      <MenuItem key={field.columnName} value={field.columnName}>
                        {field.columnName}
                      </MenuItem>
                    ))}
                    ;
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ m: 1, minWidth: 120 }}>
                  <InputLabel id="condition-simple-select-label">Condition</InputLabel>
                  <Select
                    labelId="condition-simple-select-label"
                    id="condition-simple-select"
                    label="Condition"
                    name="condition"
                    value={newFilter.condition}
                    onChange={handleFilterChange}
                  >
                    {conditions.map((condition) => (
                      <MenuItem key={condition.name} value={condition.value}>
                        {condition.name}
                      </MenuItem>
                    ))}
                    ;
                  </Select>
                </FormControl>
                <FormControl sx={{ m: 1, minWidth: 120 }}>
                  {showDate
                    ? (
                      <DatePicker
                        label="Value"
                        value={newFilter.value === '' ? null : newFilter.value}
                        onChange={(newValue) => handleFilterDateChange(newValue)}
                        format="YYYY-MM-DD"
                        slotProps={{
                          textField: {
                            size: 'small',
                          },
                        }}
                      />
                    )
                    : (
                      <TextField
                        id="outlined-basic"
                        label="Value"
                        variant="outlined"
                        name="value"
                        type={newFilter.fieldType === 'number' ? 'number' : undefined}
                        value={newFilter.value}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                          handleFilterChange(event);
                        }}
                        size="small"
                        inputProps={{ maxLength: 25 }}
                      />
                    )}
                </FormControl>
                <IconButton type="submit"><AddCircle color="secondary" sx={{ p: 1 }} /></IconButton>
                <Button size="small" variant="contained" onClick={clearFilters} disabled={filterList.length <= 0}>
                  Reset
                </Button>
                <br />
                {filterList.map((filter) => (
                  <Chip
                    key={filter.field + filter.condition + filter.value}
                    label={(
                      <>
                        {filter.field}
                        {' '}
                        <b>
                          {filter.fieldType === 'date'
                            ? (dateConditions.find((c) => c.value === filter.condition))?.name
                            : null}
                          {filter.fieldType === 'number'
                            ? (numberConditions.find((c) => c.value === filter.condition))?.name
                            : (stringConditions.find((c) => c.value === filter.condition))?.name}
                        </b>
                        {' '}
                        {filter.fieldType === 'date'
                          ? filter.value.format('YYYY-MM-DD')
                          : filter.value}
                      </>
                    )}
                    onDelete={() => handleFilterDelete(filter)}
                    sx={{
                      margin: 1,
                      animation:
                      filter.shakeElement === true
                        ? `${shake} 0.5s`
                        : '',
                    }}
                  />
                ))}
              </form>
              <Box sx={{ padding: 1 }}>
                <Typography variant="caption" display="block" gutterBottom>
                  {filteredMessage}
                </Typography>
              </Box>
            </Box>
          )
          : null }

      </div>
    </Box>
  );
}
export default QueryBuilder;
