import 'react-tabulator/lib/styles.css';
import 'react-tabulator/lib/css/tabulator.min.css';
import { Box, keyframes, TextField, Button, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, IconButton, Chip, Grid, Typography, Stack, Snackbar, Alert } from '@mui/material';
import React, { useEffect, useState, SetStateAction } from 'react';
import { AddBox, AddCircle, IndeterminateCheckBox, CloseRounded } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateValidationError } from '@mui/x-date-pickers';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { DataTableFilterMeta, DataTableOperatorFilterMetaData } from 'primereact/datatable';
import FieldTypes from '../../constants/fieldTypes';
import { stringConditions, dateConditions, numberConditions, dateConditionsPR, stringCondtitionPR, numberConditionsPR, booleanConditionsPR } from './fieldTypeOperators';
import { Sample } from '../../types/sample.interface';
import { Field } from '../../types/dtos';

export interface DataFilter {
  shakeElement?: boolean,
  field: string,
  fieldType: string,
  condition: FilterMatchMode | string,
  value: any
}

interface DataFiltersProps {
  data: any // need to pass through
  visibleFields: Sample[] // need to passs through
  allFields: Field[] // need to pass through
  setPrimeReactFilters: React.Dispatch<SetStateAction<DataTableFilterMeta>>
  isOpen: boolean
  setIsOpen: React.Dispatch<SetStateAction<boolean>>
  filterList: DataFilter[]
  setFilterList: React.Dispatch<SetStateAction<DataFilter[]>>
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
    data,
    visibleFields,
    allFields,
    setPrimeReactFilters,
    isOpen,
    setIsOpen,
    filterList,
    setFilterList,
  } = props;
  const [sampleCount, setSampleCount] = useState();
  const [totalSamples, setTotalSamples] = useState();
  const [newFilter, setNewFilter] = useState(initialFilterState);
  const [conditions, setConditions] = useState(stringCondtitionPR);
  const [selectedFieldType, setSelectedFieldType] = useState(FieldTypes.STRING);
  const [filterError, setFilterError] = useState(false);
  const [filterErrorMessage, setFilterErrorMessage] = useState('An error has occured in the filters.');
  const [nullOrEmptyFlag, setNullOrEmptyFlag] = useState(false);
  const [dateError, setDateError] = useState<DateValidationError>(null);
  const [fields, setFields] = useState<Field[]>([]);

  useEffect(() => {
    setSampleCount(data.length);
    setTotalSamples(data.length);
  }, [data]);

  useEffect(() => {
    if (allFields.length > 0) {
      const vFields = allFields
        .filter((field) => visibleFields
          .find((visibleField) => visibleField.field === field.columnName));
      setFields(vFields);
    }
  }, [allFields, visibleFields]);

  const handleFilterChange = (event: SelectChangeEvent) => {
    if (event.target.name === 'field') {
      setDateError(null);
      const targetFieldProps = fields.find((field: Field) =>
        field.columnName === event.target.value);
      let defaultCondition = '';
      if (targetFieldProps?.primitiveType === FieldTypes.DATE) {
        setConditions(dateConditionsPR);
        setSelectedFieldType(FieldTypes.DATE);
        defaultCondition = FilterMatchMode.GREATER_THAN_OR_EQUAL_TO;
      } else if (targetFieldProps?.primitiveType === FieldTypes.NUMBER) {
        setConditions(numberConditionsPR);
        setSelectedFieldType(FieldTypes.NUMBER);
        defaultCondition = FilterMatchMode.EQUALS;
      } else if (targetFieldProps?.primitiveType === FieldTypes.BOOLEAN) {
        setConditions(booleanConditionsPR);
        setSelectedFieldType(FieldTypes.BOOLEAN);
        defaultCondition = FilterMatchMode.EQUALS;
      } else {
        setConditions(stringCondtitionPR);
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
  // useEffect(() => {
  //   const filters: any = [];
  //   if (filterList.length !== 0) {
  //     filterList.forEach((filter) => {
  //       // If filter condition requires a custom filter function
  //       const custom = customFilterFunctions.filter(e => e.operator === filter.condition);
  //       if (custom.length > 0) {
  //         filters.push({
  //           field: custom[0].function,
  //           type: { field: filter.field, value: filter.value },
  //           value: undefined,
  //         });
  //       } else if (filter.fieldType === FieldTypes.DATE && filter.value !== nullOrEmptyString) {
  //         const date = filter.value;
  //         const dayStart = date.$d.toISOString();
  //         const dayEnd = (new Date((date.$d.getTime() + 86399000))).toISOString();
  //         if (filter.condition === FilteringOperators.GREATER_OR_EQUAL) {
  //           filters.push({
  //             field: filter.field,
  //             type: filter.condition,
  //             value: dayStart,
  //           });
  //         } else if (filter.condition === FilteringOperators.LESS_OR_EQUAL) {
  //           filters.push({
  //             field: filter.field,
  //             type: filter.condition,
  //             value: dayEnd,
  //           });
  //         } else if (filter.condition === FilteringOperators.EQUALS) {
  //           filters.push(
  //             {
  //               field: filter.field,
  //               type: FilteringOperators.LESS,
  //               value: dayEnd,
  //             },
  //             {
  //               field: filter.field,
  //               type: FilteringOperators.GREATER,
  //               value: dayStart,
  //             },
  //           );
  //         }
  //       } else {
  //         filters.push({
  //           field: filter.field,
  //           type: filter.condition,
  //           value: filter.value,
  //         });
  //       }
  //     });
  //   }
  //   setTabulatorFilters(filters);
  // }, [filterList]);

  // Build filters in the prime react format
  useEffect(() => {
    const filtersBuilder: DataTableFilterMeta = {};
    if (filterList.length !== 0) {
      filterList.forEach((filter) => {
        if (filter.fieldType === FieldTypes.DATE) {
          const date = filter.value;
          const dayStart = date.$d.toLocaleString('sv').replace(' ', 'T');
          const dayEnd = (new Date((date.$d.getTime() + 86399000))).toLocaleString('sv').replace(' ', 'T');
          if (filter.condition === FilterMatchMode.DATE_IS && (filter.field === 'Date_created' || filter.field === 'Date_updated')) {
            if (filtersBuilder[filter.field]) {
              // Append new constraints to the existing filters
              (filtersBuilder[filter.field] as DataTableOperatorFilterMetaData).constraints.push(
                { value: dayEnd, matchMode: FilterMatchMode.DATE_BEFORE },
                { value: dayStart, matchMode: FilterMatchMode.DATE_AFTER },
              );
            } else {
              // Create new filters for this column
              filtersBuilder[filter.field] = {
                operator: FilterOperator.AND,
                constraints: [
                  { value: dayEnd, matchMode: FilterMatchMode.DATE_BEFORE },
                  { value: dayStart, matchMode: FilterMatchMode.DATE_AFTER },
                ],
              };
            }
          } else if (filtersBuilder[filter.field]) {
            (filtersBuilder[filter.field] as DataTableOperatorFilterMetaData).constraints.push(
              { value: filter.value, matchMode: filter.condition as FilterMatchMode },
            );
          } else {
            filtersBuilder[filter.field] = {
              operator: FilterOperator.AND,
              constraints: [
                {
                  value: filter.value,
                  matchMode: filter.condition as FilterMatchMode,
                },
              ],
            };
          }
        } else if (filtersBuilder[filter.field]) {
          // Append new constraints to the existing filters
          (filtersBuilder[filter.field] as DataTableOperatorFilterMetaData).constraints.push(
            { value: filter.value, matchMode: filter.condition as FilterMatchMode },
          );
        } else {
          filtersBuilder[filter.field] = {
            operator: FilterOperator.AND,
            constraints: [
              {
                value: filter.value,
                matchMode: filter.condition as FilterMatchMode,
              },
            ],
          };
        }
      });
    }
    setPrimeReactFilters(filtersBuilder);
  }, [filterList, setPrimeReactFilters]);

  // { value: FilterMatchMode.DATE_IS, name: 'On' },
  // { value: FilterMatchMode.DATE_BEFORE, name: 'On and before' },
  // { value: FilterMatchMode.DATE_AFTER, name: 'On and after' },
  // { value: FilterMatchMode.DATE_IS_NOT, name: 'Is not' },

  // Should only be called when tableInstanceRef.current is set
  // const updateFilteredData = useCallback(() => {
  //   const filtered = tableInstanceRef.current.searchData(tabulatorFilters);
  //   setSampleCount(filtered.length);
  //   setFilteredData(filtered);
  // }, [tabulatorFilters, setSampleCount, setFilteredData]);

  // Update filtered data when filters change
  // useEffect(() => {
  //   if (tableInstanceRef.current) {
  //     updateFilteredData();
  //   }
  // }, [updateFilteredData]);

  // Update filtered data when data changes or when tabulator is first ready
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // const handleDataUpdate = (_data: any) => {
  //   updateFilteredData();
  // };

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
              <form onSubmit={(event) => handleFilterAdd(event)} style={{ display: 'flex', alignItems: 'center' }}>
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
                <IconButton type="submit"><AddCircle color="secondary" /></IconButton>
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
                            // eslint-disable-next-line no-nested-ternary
                            filter.fieldType === FieldTypes.DATE
                              ? (dateConditions.find((c) => c.value === filter.condition))?.name
                              : filter.fieldType === FieldTypes.NUMBER
                                ? (numberConditions.find((c) => c.value === filter.condition))?.name
                                : (stringConditions.find((c) => c.value === filter.condition))?.name
                          }
                        </b>
                        {' '}
                        {
                          // eslint-disable-next-line no-nested-ternary
                          filter.value === nullOrEmptyString
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
