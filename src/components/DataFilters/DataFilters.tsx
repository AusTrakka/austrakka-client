import 'react-tabulator/lib/styles.css';
import 'react-tabulator/lib/css/tabulator.min.css';
import { Box, keyframes, TextField, Button, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, IconButton, Chip, Grid, Typography, Stack, Snackbar, Alert } from '@mui/material';
import React, { useEffect, useState, SetStateAction } from 'react';
import { AddBox, AddCircle, IndeterminateCheckBox, CloseRounded } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateValidationError } from '@mui/x-date-pickers';
import { FilterMatchMode, FilterOperator, FilterService } from 'primereact/api';
import { DataTableFilterMeta, DataTableOperatorFilterMetaData } from 'primereact/datatable';
import FieldTypes from '../../constants/fieldTypes';
import { dateConditions, stringConditions, numberConditions, booleanConditions, CustomFilterOperators } from './fieldTypeOperators';
import { Field, ProjectViewField } from '../../types/dtos';

export interface DataFilter {
  shakeElement?: boolean,
  field: string,
  fieldType: string,
  condition: FilterMatchMode | CustomFilterOperators | string,
  value: any
}

function emptyFilter(value: any, filters: boolean | null) {
  const includeEmpty = filters ?? null;
  if (includeEmpty === null) {
    return true;
  }
  if (includeEmpty === true) {
    // If includeEmpty is true, return true for empty strings and false for non-empty strings
    return value === '' || value === null;
  }
  // If includeEmpty is false, return true for non-empty strings and false for empty strings
  return value !== '' && value !== null;
}

interface DataFiltersProps {
  dataLength: number // need to pass through
  filteredDataLength: number // need to pass through
  visibleFields: any[] | null // need to passs through
  allFields: ProjectViewField[] // need to pass through
  setPrimeReactFilters: React.Dispatch<SetStateAction<DataTableFilterMeta>>
  isOpen: boolean
  setIsOpen: React.Dispatch<SetStateAction<boolean>>
  filterList: DataFilter[]
  setFilterList: React.Dispatch<SetStateAction<DataFilter[]>>
  setLoadingState: React.Dispatch<SetStateAction<boolean>>
}

const initialFilterState = {
  field: '',
  condition: '',
  value: '',
  fieldType: '',
  shakeElement: false,
};

const shake = keyframes`
  0% { transform: translateY(0) }
  25% { transform: translateY(5px) }
  50% { transform: translateY(-5px) }
  75% { transform: translateY(5px) }
  100% { transform: translateY(0) }
`;

const nullOrEmptyString = 'null-or-empty';

function DataFilters(props: DataFiltersProps) {
  const {
    dataLength,
    filteredDataLength,
    visibleFields,
    allFields,
    setPrimeReactFilters,
    isOpen,
    setIsOpen,
    filterList,
    setFilterList,
    setLoadingState,
  } = props;
  const [sampleCount, setSampleCount] = useState<number | undefined>();
  const [totalSamples, setTotalSamples] = useState<number | undefined>();
  const [newFilter, setNewFilter] = useState(initialFilterState);
  const [conditions, setConditions] = useState(stringConditions);
  const [selectedFieldType, setSelectedFieldType] = useState(FieldTypes.STRING);
  const [filterError, setFilterError] = useState(false);
  const [filterErrorMessage, setFilterErrorMessage] = useState('An error has occured in the filters.');
  const [nullOrEmptyFlag, setNullOrEmptyFlag] = useState(false);
  const [dateError, setDateError] = useState<DateValidationError>(null);
  const [fields, setFields] = useState<Field[]>([]);

  useEffect(() => {
    setSampleCount(filteredDataLength);
    setTotalSamples(dataLength);
  }, [dataLength, filteredDataLength]);

  useEffect(() => {
    if (allFields.length > 0) {
      if (visibleFields === null) {
        setFields(allFields);
      } else {
        const vFields = allFields
          .filter((field) => visibleFields
            .find((visibleField) => visibleField.field === field.columnName));
        setNewFilter(initialFilterState);
        setFields(vFields);
      }
    }
    allFields.forEach(field => {
      FilterService.register(`custom_${field.columnName}`, (value, filters) =>
        emptyFilter(value, filters));
    });
  }, [allFields, visibleFields]);

  const handleFilterChange = (event: SelectChangeEvent) => {
    if (event.target.name === 'field') {
      setDateError(null);
      const targetFieldProps = fields.find((field: Field) =>
        field.columnName === event.target.value);
      let defaultCondition = '';
      if (targetFieldProps?.primitiveType === FieldTypes.DATE) {
        setConditions(dateConditions);
        setSelectedFieldType(FieldTypes.DATE);
        defaultCondition = FilterMatchMode.DATE_IS;
      } else if (
        targetFieldProps?.primitiveType === FieldTypes.NUMBER ||
        targetFieldProps?.primitiveType === FieldTypes.DOUBLE
      ) {
        setConditions(numberConditions);
        setSelectedFieldType(targetFieldProps!.primitiveType);
        defaultCondition = FilterMatchMode.EQUALS;
      } else if (targetFieldProps?.primitiveType === FieldTypes.BOOLEAN) {
        setConditions(booleanConditions);
        setSelectedFieldType(FieldTypes.BOOLEAN);
        defaultCondition = FilterMatchMode.EQUALS;
      } else {
        setConditions(stringConditions);
        setSelectedFieldType(FieldTypes.STRING);
        defaultCondition = FilterMatchMode.EQUALS;
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
      const flag = (event.target.name === 'condition' && event.target.value.includes('null'));
      setNullOrEmptyFlag(flag);
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
    setLoadingState(true);
    event.preventDefault();
    const isEmpty = Object.values(newFilter).some((x) => x === null || x === '');
    if ((!isEmpty || (newFilter.field !== '' && newFilter.condition !== '' && nullOrEmptyFlag)) && dateError === null) {
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
        const filter: DataFilter = {
          field: newFilter.field,
          condition: newFilter.condition,
          value: newFilter.value,
          fieldType: newFilter.fieldType,
          shakeElement: newFilter.shakeElement,
        };
        setFilterList((prevState) => [...prevState, filter]);
        setNewFilter(initialFilterState);
        setNullOrEmptyFlag(false);
      }
    }
    setLoadingState(false);
  };

  const clearFilters = () => {
    setLoadingState(true);
    setFilterError(false);
    setFilterList([]);
  };

  const handleFilterDelete = (filter: DataFilter) => {
    setFilterList((oldList) => oldList.filter((filterEntry) => filterEntry !== filter));
  };

  // Build filters in the prime react format
  useEffect(() => {
    const filtersBuilder: DataTableFilterMeta = {};

    if (filterList.length === 0) {
      setPrimeReactFilters(filtersBuilder);
      return;
    }

    filterList.forEach((filter) => {
      const { field, fieldType, condition, value } = filter;
      const isDateField = fieldType === FieldTypes.DATE;
      const isNullOrEmptyCondition =
        condition === CustomFilterOperators.NULL_OR_EMPTY;
      const isNotNullOrEmptyCondition =
        condition === CustomFilterOperators.NOT_NULL_OR_EMPTY;

      let filterValue;
      switch (true) {
        case isNullOrEmptyCondition:
          filterValue = true;
          break;
        case isNotNullOrEmptyCondition:
          filterValue = false;
          break;
        case isDateField:
          filterValue = new Date(value.$d);
          break;
        default:
          filterValue = value;
          break;
      }

      const filterMatchMode = isNullOrEmptyCondition || isNotNullOrEmptyCondition
        ? FilterMatchMode.CUSTOM
        : condition;

      const filterConstraint = {
        value: filterValue,
        matchMode: filterMatchMode as FilterMatchMode,
      };

      if (filtersBuilder[field]) {
        (filtersBuilder[field] as DataTableOperatorFilterMetaData).constraints.push(
          filterConstraint,
        );
      } else {
        filtersBuilder[field] = {
          operator: FilterOperator.AND,
          constraints: [filterConstraint],
        };
      }
    });
    setPrimeReactFilters(filtersBuilder);
  }, [filterList, setPrimeReactFilters]);

  const renderValueElement = () => {
    switch (selectedFieldType) {
      case FieldTypes.DATE:
        return (
          <DatePicker
            label="Value"
            value={newFilter.value === '' ? null : newFilter.value}
            onError={(newError) => setDateError(newError)}
            onChange={(newValue) => handleFilterDateChange(newValue)}
            format="YYYY-MM-DD"
            slotProps={{
              textField: {
                size: 'small',
              },
            }}
            disabled={nullOrEmptyFlag}
            disableFuture
          />
        );
      case FieldTypes.BOOLEAN:
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
            type={(newFilter.fieldType === FieldTypes.NUMBER ||
              newFilter.fieldType === FieldTypes.DOUBLE) ?
              'number' :
              undefined}
            value={newFilter.value}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              handleFilterChange(event);
            }}
            size="small"
            inputProps={(newFilter.fieldType === FieldTypes.NUMBER ||
              newFilter.fieldType === FieldTypes.DOUBLE) ?
              { step: 'any' } :
              { maxLength: 25 }}
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
    <Box sx={{ paddingTop: 1 }}>
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
                <div style={{ display: 'flex', alignItems: 'center' }}>
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
                      {fields.map((field : Field) => (
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
                  <IconButton
                    type="submit"
                    disabled={!nullOrEmptyFlag && (Object.values(newFilter).some((x) => x === null || x === ''))}
                  >
                    <AddCircle color={!nullOrEmptyFlag &&
                    Object.values(newFilter).some((x) => x === null || x === '') ?
                      'disabled' : 'secondary'}
                    />
                  </IconButton>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={clearFilters}
                    disabled={filterList.length <= 0}
                  >
                    Reset
                  </Button>
                  <br />
                </div>
                {filterList.map((filter) => (
                  <Chip
                    key={filter.field + filter.condition + filter.value}
                    label={(
                      <>
                        {filter.field}
                        {' '}
                        <b>
                          {
                            // eslint-disable-next-line no-nested-ternary
                            filter.fieldType === FieldTypes.DATE
                              ? (dateConditions.find((c) => c.value === filter.condition))?.name
                              : (filter.fieldType === FieldTypes.NUMBER ||
                                 filter.fieldType === FieldTypes.DOUBLE)
                                ? (numberConditions
                                  .find((c) => c.value === filter.condition))?.name
                                : (stringConditions
                                  .find((c) => c.value === filter.condition))?.name
                          }
                        </b>
                        {' '}
                        {
                          // eslint-disable-next-line no-nested-ternary
                          (filter.condition === CustomFilterOperators.NULL_OR_EMPTY ||
                            filter.condition === CustomFilterOperators.NOT_NULL_OR_EMPTY)
                            ? null
                            : filter.fieldType === FieldTypes.DATE
                              ? filter.value.format('YYYY-MM-DD')
                              : `${filter.value}`
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
    </Box>
  );
}
export default DataFilters;
