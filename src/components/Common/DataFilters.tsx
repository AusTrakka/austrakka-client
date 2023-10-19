/* eslint-disable @typescript-eslint/no-unused-vars */
import 'react-tabulator/lib/styles.css';
import 'react-tabulator/lib/css/tabulator.min.css';
import { Box, keyframes, TextField, Button, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, IconButton, Chip, Grid, Typography, Stack, Snackbar, Alert } from '@mui/material';
import React, { useEffect, useState, useRef } from 'react';
import { ReactTabulator } from 'react-tabulator';
import { AddBox, AddCircle, IndeterminateCheckBox, CloseRounded } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { buildTabulatorColumnDefinitions, compareFields } from '../../utilities/tableUtils';
import FieldTypes from '../../constants/fieldTypes';
import { MetaDataColumn } from '../../types/dtos';

// equal (=)
// not equal (!=)
// like (like)
// keywords (keywords)
// starts with (starts)
// ends with (ends)
// less than (<)
// less than or equal to (<=)
// greater than (>)
// greater than or equal to (>=)
// in array (in)
// regex (regex)

// Custom filter functions needed:
// - contains/doesn't contain
// - is null or empty/is not null or empty

// Example custom filter
function customFilter(records: any, filterParams: any) {
  if (records.Seq_ID === 'Sample21') {
    return true;
  }
  return false;
}

interface Filter {
  shakeElement?: boolean,
  field: string,
  fieldType: string,
  condition: string,
  value: any
}

interface DataFiltersProps {
  data: any
  filteredData: any
  setFilteredData: any
  fields: any
}

const initialFilterState = {
  field: '',
  condition: '',
  value: '',
  fieldType: '',
  shakeElement: false,
};
const stringConditions = [
  // { key: '@=', value: '@=', name: 'Contains' },
  // { key: '!@=', value: '!@=', name: 'Doesn\'t Contain' },
  { key: '=', value: '=', name: 'Equals' },
  { key: '!=', value: '!=', name: 'Doesn\'t Equal' },
  { key: 'starts', value: 'starts', name: 'Starts With' },
  { key: 'ends', value: 'ends', name: 'Ends With' },
  { key: '==NULL', value: '==NULL', name: 'Is null or empty' },
  // { key: '!=NULL', value: '!=NULL', name: 'Is not null or empty' },
];
const dateConditions = [
  // { key: '=', value: '=', name: 'On' },
  // { key: '<=', value: '<=', name: 'On and before' },
  // { key: '>=', value: '>=', name: 'On and after' },
  // { key: '==NULL', value: '==NULL', name: 'Is null or empty' },
  // { key: '!=NULL', value: '!=NULL', name: 'Is not null or empty' },
];
const numberConditions = [
  { key: '=', value: '=', name: 'Equals' },
  { key: '!=', value: '!=', name: 'Doesn\'t equal' },
  { key: '<', value: '<', name: 'Less than' },
  { key: '>', value: '>', name: 'Greater than' },
  { key: '<=', value: '<=', name: 'Less than or equal to' },
  { key: '>=', value: '>=', name: 'Greater than or equal to' },
  // { key: '==NULL', value: '==NULL', name: 'Is null or empty' },
  // { key: '!=NULL', value: '!=NULL', name: 'Is not null or empty' },
];
const booleanConditions = [
  { key: '=', value: '=', name: 'Equals' },
  { key: '!=', value: '!=', name: 'Doesn\'t Equal' },
  // { key: '==NULL', value: '==NULL', name: 'Is null or empty' },
  // { key: '!=NULL', value: '!=NULL', name: 'Is not null or empty' },
];

const customFilterFunctions = [
  { conditionValue: '==NULL', function: customFilter },
  { conditionValue: '!=NULL', function: null },
  { conditionValue: '@=', function: null },
  { conditionValue: '!@=', function: null },
];

const shake = keyframes`
  0% { transform: translateY(0) }
  25% { transform: translateY(5px) }
  50% { transform: translateY(-5px) }
  75% { transform: translateY(5px) }
  100% { transform: translateY(0) }
`;

const nullOrEmptyString = 'null-or-empty';

function DataFilters(props: DataFiltersProps) {
  const { data, fields, filteredData, setFilteredData } = props;
  const tableInstanceRef = useRef<string | HTMLAnchorElement | any>(null);
  const [sampleCount, setSampleCount] = useState();
  const [totalSamples, setTotalSamples] = useState();
  const [isOpen, setIsOpen] = useState(false);
  const [columns, setColumns] = useState<{ title: string; field: string; }[]>([]);
  const [newFilter, setNewFilter] = useState(initialFilterState);
  const [conditions, setConditions] = useState(stringConditions);
  const [selectedFieldType, setSelectedFieldType] = useState(FieldTypes.STRING);
  const [filterError, setFilterError] = useState(false);
  const [filterErrorMessage, setFilterErrorMessage] = useState('An error has occured in the filters.');
  const [nullOrEmptyFlag, setNullOrEmptyFlag] = useState(false);
  const [filterList, setFilterList] = useState<Filter[]>([]);
  const [tabulatorFilters, setTabulatorFilters] = useState([]);

  useEffect(() => {
    setSampleCount(data.length);
    setTotalSamples(data.length);
  }, [data]);

  // Set table columns on load
  useEffect(() => {
    const copy = [...fields];
    const sortedDisplayFields = copy.sort(compareFields);
    const columnBuilder = buildTabulatorColumnDefinitions(sortedDisplayFields);
    setColumns(columnBuilder);
  }, [fields]);

  const handleFilterChange = (event: SelectChangeEvent) => {
    if (event.target.name === 'field') {
      const targetFieldProps = fields.find((field: MetaDataColumn) =>
        field.columnName === event.target.value);

      let defaultCondition = '';
      if (targetFieldProps?.primitiveType === FieldTypes.DATE) {
        setConditions(dateConditions);
        setSelectedFieldType(FieldTypes.DATE);
        defaultCondition = '>=';
      } else if (targetFieldProps?.primitiveType === FieldTypes.NUMBER) {
        setConditions(numberConditions);
        setSelectedFieldType(FieldTypes.NUMBER);
        defaultCondition = '=';
      } else if (targetFieldProps?.primitiveType === FieldTypes.BOOLEAN) {
        setConditions(booleanConditions);
        setSelectedFieldType(FieldTypes.BOOLEAN);
        defaultCondition = '=';
      } else {
        setConditions(stringConditions);
        setSelectedFieldType(FieldTypes.STRING);
        defaultCondition = '=';
      }
      setNullOrEmptyFlag(false);
      setNewFilter({
        ...newFilter,
        [event.target.name]: event.target.value as string,
        fieldType: targetFieldProps?.primitiveType || FieldTypes.STRING,
        condition: defaultCondition,
        value: '',
      });
    } else {
      const flag = (event.target.name === 'condition' && event.target.value.includes('NULL'));
      setNullOrEmptyFlag(flag);
      if (flag) {
        setNewFilter({
          ...newFilter,
          [event.target.name]: event.target.value as string,
          value: (event.target.name === 'condition' && event.target.value.includes('NULL')) ? nullOrEmptyString : '',
        });
      } else {
        setNewFilter({
          ...newFilter,
          [event.target.name]: event.target.value as string,
        });
      }
    }
  };

  const handleFilterDateChange = (newDate: any) => {
    const dayStart = newDate.$d.toISOString();
    const dayEnd = (new Date((newDate.$d.getTime() + 86399000))).toISOString();
    // TODO: Date filtering logic
    setNewFilter({
      ...newFilter,
      value: newDate,
    });
  };

  const handleFilterAdd = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isEmpty = Object.values(newFilter).some((x) => x === null || x === '');
    if (!isEmpty || (newFilter.field !== '' && newFilter.condition !== '' && nullOrEmptyFlag)) {
      let doesExist = false;
      for (let i = 0; i < filterList.length; i += 1) {
        const filter = filterList[i];
        if (filter.condition === newFilter.condition
          && filter.value.toString() === newFilter.value.toString()
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
        const filter: Filter = {
          field: newFilter.field,
          condition: newFilter.condition,
          value: nullOrEmptyFlag ? nullOrEmptyString : newFilter.value,
          fieldType: newFilter.fieldType,
          shakeElement: newFilter.shakeElement,
        };
        setFilterList((prevState) => [...prevState, filter]);
        setNewFilter(initialFilterState);
        setNullOrEmptyFlag(false);
      }
    }
  };

  const clearFilters = () => {
    setFilterError(false);
    setFilterList([]);
  };

  const handleFilterDelete = (filter: object) => {
    setFilterList((oldList) => oldList.filter((filterEntry) => filterEntry !== filter));
  };

  // 1. Build filters in tabulator format
  useEffect(() => {
    const filters: any = [];
    if (filterList.length !== 0) {
      filterList.forEach((filter) => {
        // If filter condition requires a custom fitler function
        const isCustom = customFilterFunctions.filter(e => e.conditionValue === filter.condition);
        if (isCustom.length > 0) {
          // TODO: Apply relevant custom filter function here
        } else {
          filters.push({
            field: filter.field,
            type: filter.condition,
            value: filter.value,
          });
        }
      });
    }
    setTabulatorFilters(filters);
  }, [filterList]);

  // 2. Update filtered data displayed on the plots
  useEffect(() => {
    if (tableInstanceRef.current) {
      console.log(tabulatorFilters);
      const filtered = tableInstanceRef.current.searchData(tabulatorFilters);
      console.log(filtered);
      setSampleCount(filtered.length);
      setFilteredData(filtered);
    }
  }, [tabulatorFilters, setFilteredData]);

  const renderValueElement = () => {
    switch (selectedFieldType) {
      case 'date':
        return (
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
            disabled={nullOrEmptyFlag}
          />
        );
      case 'boolean':
        return (
          <>
            <InputLabel id="condition-simple-select-label">Value</InputLabel>
            <Select
              labelId="condition-simple-select-label"
              id="value-simple-select"
              label="Value"
              name="value"
              value={newFilter.value}
              onChange={handleFilterChange}
              disabled={nullOrEmptyFlag}
            >
              <MenuItem value={true as any}>
                True
              </MenuItem>
              <MenuItem value={false as any}>
                False
              </MenuItem>
            </Select>
          </>
        );
      // Default return captures string and number types
      default:
        return (
          <TextField
            id="outlined-basic"
            label="Value"
            variant="outlined"
            name="value"
            type={newFilter.fieldType === FieldTypes.NUMBER ? FieldTypes.NUMBER : undefined}
            value={newFilter.value}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              handleFilterChange(event);
            }}
            size="small"
            inputProps={{ maxLength: 25 }}
            disabled={nullOrEmptyFlag}
          />
        );
    }
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
      <CloseRounded fontSize="small" />
    </IconButton>
  );

  return (
    <Box sx={{ paddingTop: 4 }}>
      <Box sx={{
        boxShadow: 1, borderRadius: 1, padding: 1, marginBottom: 2, display: 'flex', backgroundColor: 'white',
      }}
      >
        <Grid container>
          <Button onClick={() => setIsOpen(!isOpen)} sx={{ textTransform: 'none' }} fullWidth>
            <Grid container direction="row" justifyContent="space-between">
              <Grid item sx={{ fontWeight: 'bold' }}>
                <Stack direction="row" alignItems="center" gap={1}>
                  {isOpen ? <IndeterminateCheckBox /> : <AddBox />}
                  <Typography sx={{ fontWeight: 'bold' }}>Filters</Typography>
                </Stack>
              </Grid>
              <Grid item sx={{ paddingLeft: 8 }}>
                {`Showing ${sampleCount} of ${totalSamples} samples.` }
              </Grid>
            </Grid>
          </Button>
          <Snackbar
            open={filterError}
            autoHideDuration={5000}
            message={filterErrorMessage}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            onClose={closeSnackbar}
            action={action}
          >
            <Alert onClose={closeSnackbar} severity="error" elevation={6}>
              {filterErrorMessage}
            </Alert>
          </Snackbar>
          { isOpen ? (
            <Box>
              <Snackbar
                open={sampleCount === 0 && filterList.length > 0}
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
                    {fields.map((field : MetaDataColumn) => (
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
                { nullOrEmptyFlag ? null : (
                  <FormControl size="small" sx={{ m: 1, minWidth: 120 }}>
                    {renderValueElement()}
                  </FormControl>
                )}
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
                          {
                            filter.fieldType === FieldTypes.DATE
                            && filter.value !== nullOrEmptyString
                              ? (dateConditions.find((c) => c.value === filter.condition))?.name
                              : null
                          }
                          {
                            filter.fieldType === FieldTypes.NUMBER
                              ? (numberConditions.find((c) => c.value === filter.condition))?.name
                              : (stringConditions.find((c) => c.value === filter.condition))?.name
                          }
                        </b>
                        {' '}
                        {
                          filter.fieldType === FieldTypes.DATE && filter.value !== nullOrEmptyString
                            ? filter.value.format('YYYY-MM-DD')
                            : null
                        }
                        {
                          filter.fieldType !== FieldTypes.DATE && filter.value !== nullOrEmptyString
                            ? `${filter.value}`
                            : null
                        }
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
            </Box>
          ) : null }
        </Grid>
      </Box>

      {/* Hidden tabulator instance to filter data programmatically */}
      <Box sx={{ display: 'none' }}>
        <ReactTabulator
          data={data}
          columns={columns}
          // eslint-disable-next-line no-return-assign
          onRef={(r) => (tableInstanceRef.current = r.current)}
        />
      </Box>
    </Box>
  );
}
export default DataFilters;
