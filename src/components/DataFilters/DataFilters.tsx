import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel, LinearProgress,
  MenuItem,
  Select,
  SelectChangeEvent,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React, { SetStateAction, useEffect, useState } from 'react';
import { AddBox, AddCircle, CloseRounded, IndeterminateCheckBox } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateValidationError } from '@mui/x-date-pickers';
import { FilterMatchMode, FilterOperator, FilterService } from 'primereact/api';
import { DataTableFilterMeta, DataTableOperatorFilterMetaData } from 'primereact/datatable';
import FieldTypes from '../../constants/fieldTypes';
import {
  booleanConditions,
  CustomFilterOperators,
  dateConditions,
  numberConditions,
  stringConditions,
} from './fieldTypeOperators';
import { Field } from '../../types/dtos';
import { isDataTableFiltersEqual, isOperatorFilterMetaData } from '../../utilities/filterUtils';

export const defaultState = {
  global: {
    operator: 'and',
    constraints: [{
      value: null,
      matchMode: FilterMatchMode.CONTAINS,
    }],
  } as DataTableOperatorFilterMetaData,
};

interface InternalFormProperties {
  field: string,
  fieldType?: string,
  operator: string,
  condition: string | CustomFilterOperators | FilterMatchMode,
  value: any,
}

function isEmptyFilter(value: any, filters: boolean | null) {
  const includeEmpty = filters ?? null;
  if (includeEmpty === null) {
    return true;
  }
  if (includeEmpty) {
    // If includeEmpty is true, return true for empty strings and false for non-empty strings
    return value === '' || value === null;
  }
  // If includeEmpty is false, return true for non-empty strings and false for empty strings
  return value !== '' && value !== null;
}

interface DataFiltersProps {
  dataLength: number
  filteredDataLength: number
  visibleFields: any[] | null
  allFields: Field[]
  setPrimeReactFilters: React.Dispatch<SetStateAction<DataTableFilterMeta>>
  primeReactFilters: DataTableFilterMeta
  isOpen: boolean
  setIsOpen: React.Dispatch<SetStateAction<boolean>>
  dataLoaded: boolean
  setLoadingState: React.Dispatch<SetStateAction<boolean>>
}

const defaultFormState = {
  field: '',
  operator: 'and',
  condition: '',
  value: '',
};

function DataFilters(props: DataFiltersProps) {
  const {
    dataLength,
    filteredDataLength,
    visibleFields,
    allFields,
    setPrimeReactFilters,
    primeReactFilters,
    isOpen,
    setIsOpen,
    dataLoaded,
    setLoadingState,
  } = props;
  const [sampleCount, setSampleCount] = useState<number | undefined>();
  const [totalSamples, setTotalSamples] = useState<number | undefined>();
  const [filterFormValues, setFilterFormValues] =
      useState<InternalFormProperties>(defaultFormState);
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

  function filterFieldsByVisibility<T extends Field>(
    _fields: T[],
    _visibleFields: any[],
  ): T[] {
    return _fields.filter((field): field is T =>
      _visibleFields.some((visibleField) => visibleField.field === field.columnName));
  }

  function registerFilterHandlers<T extends Field>(_fields: T[]) {
    _fields.forEach((field) => {
      FilterService.register(`custom_${field.columnName}`, (value, filters) =>
        isEmptyFilter(value, filters));
    });
  }

  useEffect(() => {
    if (allFields.length > 0) {
      if (visibleFields === null) {
        setFields(allFields);
      } else {
        const onlyVisibleField = visibleFields.filter((field) => !field.hidden);
        const vFields = filterFieldsByVisibility<Field>(
          allFields,
          onlyVisibleField,
        );
        setFields(vFields);
      }

      registerFilterHandlers<Field>(allFields);
    }
  }, [allFields, visibleFields]);

  const handleFilterChange = (event: SelectChangeEvent) => {
    const { name, value } = event.target;
    if (name === 'field') {
      setDateError(null);

      const targetFieldProps = fields.find((field: Field) =>
        field.columnName === value);

      let defaultCondition = '';
      let fieldType: FieldTypes = FieldTypes.STRING;

      if (targetFieldProps?.primitiveType === FieldTypes.DATE) {
        setConditions(dateConditions);
        fieldType = FieldTypes.DATE;
        defaultCondition = FilterMatchMode.DATE_IS;
      } else if (
        targetFieldProps?.primitiveType === FieldTypes.NUMBER ||
          targetFieldProps?.primitiveType === FieldTypes.DOUBLE
      ) {
        setConditions(numberConditions);
        fieldType = targetFieldProps.primitiveType;
        defaultCondition = FilterMatchMode.EQUALS;
      } else if (targetFieldProps?.primitiveType === FieldTypes.BOOLEAN) {
        setConditions(booleanConditions);
        fieldType = FieldTypes.BOOLEAN;
        defaultCondition = FilterMatchMode.EQUALS;
      } else {
        setConditions(stringConditions);
        fieldType = FieldTypes.STRING;
        defaultCondition = FilterMatchMode.EQUALS;
      }
      setNullOrEmptyFlag(false);
      setSelectedFieldType(fieldType as FieldTypes);
      setFilterFormValues((prevState) => ({
        ...prevState,
        [name]: value,
        fieldType,
        condition: defaultCondition,
        value: '',
      }));
    } else if (name === 'condition' && value.includes('null')) {
      setNullOrEmptyFlag(true);
      setFilterFormValues((prevState) => ({
        ...prevState,
        [name]: value as CustomFilterOperators,
        value: !value.includes('not'),
      }));
    } else {
      setFilterFormValues((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };
  
  const handleDateDependingOnCondition = (condition: FilterMatchMode, date: Date) => {
    if (condition === FilterMatchMode.DATE_AFTER) {
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999); // Set to 11:59:59 PM
      return endOfDay;
    }
    
    return date;
  };

  const handleFilterDateChange = (newDate: any) => {
    setFilterFormValues((prevState) => ({
      ...prevState,
      value: newDate,
    }));
  };

  // TODO: I should really write some tests for this method some time.
  const handleFilterAdd = (event: React.FormEvent<HTMLFormElement>) => {
    setLoadingState(true);
    event.preventDefault();
    const isEmpty = Object.values(filterFormValues).some((x) => x === null || x === '');
    if ((!isEmpty || (filterFormValues.field !== '' && filterFormValues.condition !== '' && nullOrEmptyFlag)) && dateError === null) {
      let doesExist = false;
      Object.entries(primeReactFilters).forEach(([fieldName, filter]) => {
        if (isOperatorFilterMetaData(filter)) {
          if (filter.constraints[0].value === filterFormValues.value
              && filter.constraints[0].matchMode === filterFormValues.condition
              && fieldName === filterFormValues.field) {
            doesExist = true;
          }
        } else if (filter.value === filterFormValues.value
            && filter.matchMode === filterFormValues.condition
            && fieldName === filterFormValues.field) {
          doesExist = true;
        }
        // There is no shake attribute to add to the filter object, I also feel its
        // not needed as a toast message will be enough to notify the user.
      });
      if (doesExist) {
        setFilterError(true);
        setFilterErrorMessage('This filter has already been applied.');
        setFilterFormValues(defaultFormState);
      } else {
        const filterMatchMode = Object.values(CustomFilterOperators)
          .includes(filterFormValues.condition as CustomFilterOperators) ?
          FilterMatchMode.CUSTOM :
          filterFormValues.condition as FilterMatchMode;
        const filter: DataTableFilterMeta = {
          [filterFormValues.field]: {
            operator: FilterOperator.AND,
            constraints: [{
              value: filterFormValues.fieldType === FieldTypes.DATE
                ? handleDateDependingOnCondition(filterMatchMode, new Date(filterFormValues.value))
                : filterFormValues.value,
              matchMode: filterMatchMode,
            }],
          } as DataTableOperatorFilterMetaData,
        };
        const existingFilter =
            primeReactFilters[filterFormValues.field] as DataTableOperatorFilterMetaData;

        const filterOperatorObject =
            filter[filterFormValues.field] as DataTableOperatorFilterMetaData;
        // Check if the current filters are equal to the default filters
        if (isDataTableFiltersEqual(primeReactFilters, defaultState)) {
          setPrimeReactFilters(filter);
        } else if (existingFilter) {
          const holder = {
            ...primeReactFilters,
            [filterFormValues.field]: {
              operator: filterOperatorObject.operator, // Preserve existing operator
              constraints: [
                ...existingFilter.constraints, // Preserve existing constraints
                ...filterOperatorObject.constraints, // Add new constraints
              ],
            },
          };
          setPrimeReactFilters(holder);
        } else {
          setPrimeReactFilters({
            ...primeReactFilters,
            ...filter, // Add the new filter
          });
        }

        setFilterFormValues(defaultFormState);
        setNullOrEmptyFlag(false);
      }
    }
    setLoadingState(false);
  };

  const clearFilters = () => {
    setFilterError(false);
    setPrimeReactFilters(defaultState);
  };

  // TODO: This method needs to be tested as well quite crucial and a lot of edge cases.
  const handleFilterDelete = (
    _fieldName: string,
    _constraint: { value: any, matchMode: FilterMatchMode },
  ) => {
    const updatedFilters = { ...primeReactFilters };
    Object.entries(updatedFilters).forEach(([fieldName, filter]) => {
      if (_fieldName !== fieldName) return;

      if (isOperatorFilterMetaData(filter)) {
        // Handle case where the field has constraints
        filter.constraints = filter.constraints.filter(
          (constraint: any) =>
            !(
              constraint.value === _constraint.value &&
                    constraint.matchMode === _constraint.matchMode
            ),
        );
        if (filter.constraints.length === 0) {
          delete updatedFilters[fieldName];
        }
      } else if (!isOperatorFilterMetaData(filter)) {
        // Handle case where the field is a direct value and comparator
        if (filter.value === _constraint.value &&
            filter.matchMode === _constraint.matchMode) {
          delete updatedFilters[fieldName];
        }
      } else {
        // Handle case where the filter types don't match
        // eslint-disable-next-line no-console
        console.error('Filter type mismatch');
      }
    });
    setPrimeReactFilters(updatedFilters);
  };

  const renderValueElement = () => {
    switch (selectedFieldType) {
      case FieldTypes.DATE:
        return (
          <DatePicker
            label="Value"
            value={filterFormValues.value === '' ? null : filterFormValues.value}
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
              value={filterFormValues.value}
              onChange={(event) => {
                handleFilterChange(event);
              }}
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
            type={(filterFormValues.fieldType === FieldTypes.NUMBER ||
              filterFormValues.fieldType === FieldTypes.DOUBLE) ?
              'number' :
              undefined}
            value={filterFormValues.value}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              handleFilterChange(event);
            }}
            size="small"
            inputProps={(filterFormValues.fieldType === FieldTypes.NUMBER ||
              filterFormValues.fieldType === FieldTypes.DOUBLE) ?
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
    <div style={{ paddingTop: 5 }}>
      {!dataLoaded ? (
        <LinearProgress style={{ margin: 0, padding: 0, height: 5, borderRadius: 3 }} color="secondary" />
      ) : null}
      <Box>
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
                  {`Showing ${sampleCount} of ${totalSamples} samples.`}
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
            {isOpen ? (
              <Box>
                <Snackbar
                  open={sampleCount === 0 &&
                    !isDataTableFiltersEqual(primeReactFilters, defaultState)}
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
                        value={filterFormValues.field}
                        onChange={handleFilterChange}
                      >
                        {fields.map((field: Field) => (
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
                        value={filterFormValues.condition}
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
                    {nullOrEmptyFlag ? null : (
                      <FormControl size="small" sx={{ m: 1, minWidth: 120 }}>
                        {renderValueElement()}
                      </FormControl>
                    )}
                    <IconButton
                      type="submit"
                      disabled={!nullOrEmptyFlag && (Object.values(filterFormValues).some((x) => x === null || x === ''))}
                    >
                      <AddCircle color={!nullOrEmptyFlag &&
                      Object.values(filterFormValues).some((x) => x === null || x === '') ?
                        'disabled' : 'secondary'}
                      />
                    </IconButton>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={clearFilters}
                      disabled={isDataTableFiltersEqual(primeReactFilters, defaultState)}
                    >
                      Reset
                    </Button>
                    <br />
                  </div>
                  {
                  isDataTableFiltersEqual(primeReactFilters, defaultState) ? null :
                    Object.entries(primeReactFilters).flatMap(([field, filterData]) => {
                      if (isOperatorFilterMetaData(filterData)) {
                        return filterData.constraints.map((constraint) => {
                        // Determine the condition name based on matchMode
                          const conditionName = (() => {
                            const findConditionName = (_conditions: { value: string;
                              name: string }[]) =>
                              _conditions.find((c) => c.value === constraint.matchMode)?.name ||
                                (constraint.matchMode === FilterMatchMode.CUSTOM &&
                                    (constraint.value === true || constraint.value === 'true') &&
                                  'Null or Empty') ||
                                (constraint.matchMode === FilterMatchMode.CUSTOM &&
                                    (constraint.value === false || constraint.value === 'false')
                                && 'Not Null or Empty') ||
                                'Unknown';
                            return findConditionName(
                              [...dateConditions, ...numberConditions, ...stringConditions],
                            );
                          })();

                          const displayValue = (() => {
                            switch (constraint.matchMode) {
                              case FilterMatchMode.CUSTOM:
                              // Handle special cases where no value should be displayed
                                return null;
                              default:
                                return dateConditions.some((c) => c.name === conditionName)
                                  ? new Date(constraint.value).toLocaleDateString('en-CA')
                                  : `${constraint.value}`;
                            }
                          })();

                          return (
                            <Chip
                              key={`${field}-${constraint.matchMode}-${constraint.value}`}
                              label={(
                                <>
                                  {field}
                                  {' '}
                                  <b>{conditionName}</b>
                                  {' '}
                                  {displayValue}
                                </>
                                )}
                              onDelete={() => handleFilterDelete(
                                field,
                                { value: constraint.value,
                                  matchMode: constraint.matchMode as FilterMatchMode },
                              )}
                              sx={{
                                margin: 1,
                              }}
                            />
                          );
                        });
                      }
                      return [];
                    })
                }
               
                </form>
              </Box>
            ) : null}
          
          </Grid>
        </Box>
      
      </Box>
    </div>
  );
}
export default DataFilters;
