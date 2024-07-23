import { SetStateAction, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTableFilterMeta, DataTableFilterMetaData, DataTableOperatorFilterMetaData } from 'primereact/datatable';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import getQueryParamOrDefault from './navigationUtils';
import { Sample } from '../types/sample.interface';
import { HAS_SEQUENCES } from '../constants/metadataConsts';
import { DataFilter } from '../components/DataFilters/DataFilters';
import { CustomFilterOperators } from '../components/DataFilters/fieldTypeOperators';
import FieldTypes from '../constants/fieldTypes';

export function isoDateLocalDate(datetime: string): string {
  if (!datetime) return '';
  if (datetime === 'null') return '';
  const isoDate = new Date(Date.parse(datetime));
  const localDate = isoDate.toLocaleString('sv-SE', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
  return localDate;
}

export function isoDateLocalDateNoTime(datetime: string) {
  if (!datetime) return '';
  if (datetime === 'null') return '';
  const isoDate = new Date(Date.parse(datetime));
  const localDate = isoDate.toLocaleString('sv-SE', { year: 'numeric', month: 'numeric', day: 'numeric' });
  return localDate;
}

export function formatDate(dateUTC: string): string {
  if (!dateUTC) return '';
  if (dateUTC === 'null') return '';
  if (Number.isNaN(Date.parse(dateUTC))) return 'Invalid Date';
  const date = new Date(dateUTC);
  return date.toLocaleString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: 'numeric', timeZoneName: 'short' });
}

export const renderValueWithEmptyNull = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
};

// Maps from a hard-coded metadata field name to a function to render the data value
// Note that some datetime fields are included here in order to render them as datetimes,
// not just dates, which is the type default below. Ideally the server should tell us
// whether a field is a date or a datetime.
export const fieldRenderFunctions: { [index: string]: Function } = {
  'Shared_groups': (value: any) => {
    if (value === null || value === undefined) return '';

    // 1. Remove unwanted characters (optional)
    const sanitizedValue = value.toString().replace(/[[\]"']/g, '');

    // 2. Replace commas with comma and space
    const formattedValue = sanitizedValue.replace(/,/g, ', ');

    // Return the formatted value
    return formattedValue;
  },

  'Date_created': (value: string) => isoDateLocalDate(value),
  'Date_updated': (value: string) => isoDateLocalDate(value),
};

// Maps from a primitive field type to a function to render the data value
// Not every type may be here; missing types will have a default render in the caller
export const typeRenderFunctions: { [index: string]: Function } = {
  'boolean': (value: boolean): string => renderValueWithEmptyNull(value),
  'date': (value: string): string => isoDateLocalDateNoTime(value),
};

export const renderValue = (value: any, field: string, type: string): string => {
  if (field in fieldRenderFunctions) {
    return fieldRenderFunctions[field](value);
  }
  if (type in typeRenderFunctions) {
    return typeRenderFunctions[type](value);
  }
  // Possibly not needed; this fallthrough case is currently strings and numbers
  return renderValueWithEmptyNull(value);
};

// Function to aggregate counts of objects in an array, on a certain property

export function aggregateArrayObjects(property: string, array: Array<any>) {
  if (!array || !Array.isArray(array)) {
    return [];
  }

  const aggregatedCounts = [];
  const map = new Map();

  for (let i = 0; i < array.length; i += 1) {
    const item = array[i];

    if (item && typeof item === 'object' && property in item) {
      const value = item[property];
      if (map.has(value)) {
        map.set(value, map.get(value) + 1);
      } else {
        map.set(value, 1);
      }
    }
  }

  for (const [key, value] of map) {
    const obj = { [property]: key, sampleCount: value };
    aggregatedCounts.push(obj);
  }

  return aggregatedCounts;
}

// Generic function to create filter string in SSKV format from date filter object
export function generateDateFilterString(
  dateObject: { field: string, condition: string, fieldType: string, value: any },
) {
  let filterString = '';

  if (
    dateObject &&
    typeof dateObject.field === 'string' &&
    typeof dateObject.condition === 'string' &&
    typeof dateObject.fieldType === 'string' &&
    dateObject.value &&
    dateObject.value.$d instanceof Date &&
    !Number.isNaN(dateObject.value.$d.getTime()) // Ensure it's a valid date
  ) {
    const date = dateObject.value.$d.toISOString();
    filterString = `SSKV${dateObject.condition}=${dateObject.field}|${date}`;
  }

  return filterString;
}

export function replaceHasSequencesNullsWithFalse(data: Sample[]): Sample[] {
  data.forEach((sample) => {
    if (sample[HAS_SEQUENCES] === null || sample[HAS_SEQUENCES] === '') {
      sample[HAS_SEQUENCES] = false;
    }
  });

  return data;
}

export function replaceNullsWithEmpty(data: Sample[]): void {
  const replaceNullsInObject = (obj: Sample): void => {
    Object.keys(obj).forEach((key) => {
      if (obj[key] === null) {
        obj[key] = '';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        replaceNullsInObject(obj[key]);
      }
    });
  };

  data.forEach(replaceNullsInObject);
}

export function useStateFromSearchParamsForPrimitive
  <T extends string | number | boolean | null | Array<string | number | boolean | null>>(
  paramName: string,
  defaultState: T,
  searchParams: URLSearchParams,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const stateSearchParams = getQueryParamOrDefault<T>(paramName, defaultState, searchParams);
  const [state, setState] = useState<T>(stateSearchParams);
  const navigate = useNavigate();
  const useStateWithQueryParam = (newState: React.SetStateAction<T>) => {
    setState(newState);
    const currentSearchParams = new URLSearchParams(window.location.search);
    // If exists in the current searchParams, delete it
    if (currentSearchParams.has(paramName)) {
      currentSearchParams.delete(paramName);
    }
    // If differs from the default, append it to searchParams
    if (newState !== defaultState) {
      currentSearchParams.append(paramName, String(newState));
    }

    // Convert searchParams to a string
    const queryString = currentSearchParams.toString();
    // Update the URL without navigating
    navigate(`${window.location.pathname}?${queryString}`, { replace: true });
  };
  return [state, useStateWithQueryParam];
}

export function useStateFromSearchParamsForObject<T extends Record<string, any>>(
  defaultState: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const stateSearchParams = new URLSearchParams(window.location.search);
  const state: T = { ...defaultState };
  Object.keys(defaultState).forEach((key) => {
    const queryValue = getQueryParamOrDefault<T[keyof T]>(
      key,
      defaultState[key],
      stateSearchParams,
    );
    if (queryValue !== undefined) {
      state[key as keyof T] = queryValue; // Cast the value to the appropriate type
    }
  });
  const [stateObject, setStateObject] = useState<T>(state);
  const navigate = useNavigate();
  const useStateWithQueryParam = (newState: React.SetStateAction<T>) => {
    setStateObject(newState);
    const currentSearchParams = new URLSearchParams(window.location.search);
    Object.entries(newState).forEach(([key, value]) => {
      // If the key exists in the current searchParams, delete it
      if (currentSearchParams.has(key)) {
        currentSearchParams.delete(key);
      }
      // If the value differs from the default, append it to searchParams
      if (key in defaultState && value !== defaultState[key as keyof typeof state]) {
        // If the value is an empty array, append a comma to the searchParams
        if (value instanceof Array && value.length === 0) {
          currentSearchParams.append(key, ',');
        } else {
          currentSearchParams.append(key, String(value));
        }
      }
    });
    // Convert searchParams to a string
    const queryString = currentSearchParams.toString();
    // Update the URL without navigating
    navigate(`${window.location.pathname}?${queryString}`, { replace: true });
  };
  return [stateObject, useStateWithQueryParam];
}

function parseValue(value: string) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (!Number.isNaN(Number(value))) return Number(value);
  if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) return new Date(value);
  return value;
}

function isOperatorFilterMetaData(value: DataTableFilterMetaData | DataTableOperatorFilterMetaData):
  value is DataTableOperatorFilterMetaData {
  const result = 'operator' in value && 'constraints' in value;
  return result;
}

function getRawQueryParams(url: any) {
  const queryParams: { [key: string]: string } = {};
  const queryString = url.split('?')[1];
  if (!queryString) {
    return queryParams;
  }

  const pairs = queryString.split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    // Decode only the key, but keep the value as is
    queryParams[decodeURIComponent(key)] = value;
  }

  return queryParams;
}

function encodeFilterObj(filterObj: DataTableFilterMeta): string {
  const encoded = Object.entries(filterObj)
    .map(([key, value]: [string, DataTableFilterMetaData | DataTableOperatorFilterMetaData]) => {
      if (isOperatorFilterMetaData(value)) {
        const conditions = value.constraints.map(constraint =>
          `${encodeURIComponent(constraint.value)}:${constraint.matchMode}`).join(',');
        return `${encodeURIComponent(key)}:${encodeURIComponent(value.operator)}:(${conditions})`;
      }
      return `${encodeURIComponent(key)}:${encodeURIComponent(value.value)}:${value.matchMode}`;
    });

  // Join the encoded pairs with commas and add parentheses
  const result = encoded.join(',');
  return `(${result})`;
}

function decodeFilterObj(encodedString: string): DataTableFilterMeta {
  const decodedObj: DataTableFilterMeta = {};

  const pairs = encodedString.slice(1, -1).split(/,\s*(?![^(]*\))/);
  pairs.forEach(pair => {
    const [encodedKey, ...rest] = pair.split(':');
    const key = decodeURIComponent(encodedKey);
    if (rest.length === 2) {
      // This is a simple filter
      decodedObj[key] = {
        value: parseValue(decodeURIComponent(rest[0])),
        matchMode: rest[1] as FilterMatchMode,
      };
    } else if (rest.length > 2) {
      // This is an operator filter
      const operator = rest[0];
      const constraintsString = rest.slice(1).join(':');
      const constraints = constraintsString.slice(1, -1).split(','); // Remove parentheses and split
      decodedObj[key] = {
        operator: operator as FilterOperator,
        constraints: constraints.map(constraint => {
          const [value, matchMode] = constraint.split(':');
          return {
            value: parseValue(decodeURIComponent(value)),
            matchMode: matchMode as FilterMatchMode,
          };
        }),
      };
    }
  });

  return decodedObj;
}

const getFilterObjFromSearchParams = (paramName: string, defaultState: DataTableFilterMeta) => {
  const params = getRawQueryParams(window.location.search);
  const filterString = params[paramName];
  if (filterString === null || filterString === undefined) return defaultState;
  return decodeFilterObj(filterString);
};

function resolveState(
  newState: SetStateAction<DataTableFilterMeta>,
  currentState: DataTableFilterMeta,
):
  DataTableFilterMeta {
  if (typeof newState === 'function') {
    // If it's a function, call it with the current state
    return (newState as (prevState: DataTableFilterMeta) => DataTableFilterMeta)(currentState);
  }
  // If it's not a function, it's already the new state
  return newState;
}
function isEqualFilterMetaData(
  filter1: DataTableFilterMetaData,
  filter2: DataTableFilterMetaData,
): boolean {
  const result = filter1.value === filter2.value && filter1.matchMode === filter2.matchMode;
  return result;
}

export function isEqual(obj1: DataTableFilterMeta, obj2: DataTableFilterMeta): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  // first we could check if the keys have the same values
  if (!keys1.every(key => keys2.includes(key))) {
    return false;
  }

  if (keys1.length !== keys2.length) {
    return false;
  }

  // lets sort the keys to make sure we are comparing the same keys
  keys1.sort();
  keys2.sort();

  for (const key of keys1) {
    const val1 = obj1[key];
    const val2 = obj2[key];

    if (isOperatorFilterMetaData(val1) && isOperatorFilterMetaData(val2)) {
      if (val1.operator !== val2.operator || val1.constraints.length !== val2.constraints.length) {
        return false;
      }
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < val1.constraints.length; i++) {
        if (!isEqualFilterMetaData(val1.constraints[i], val2.constraints[i])) {
          return false;
        }
      }
    } else if (!isOperatorFilterMetaData(val1) && !isOperatorFilterMetaData(val2)) {
      if (!isEqualFilterMetaData(val1, val2)) {
        return false;
      }
    } else {
      return false;
    }
  }

  return true;
}

export function useStateFromSearchParamsForFilterObject(
  paramName: string,
  defaultFilter: DataTableFilterMeta,
): [DataTableFilterMeta, React.Dispatch<React.SetStateAction<DataTableFilterMeta>>] {
  const stateSearchParams = getFilterObjFromSearchParams(paramName, defaultFilter);
  const [state, setState] = useState<DataTableFilterMeta>(stateSearchParams);

  const navigate = useNavigate();

  const useStateWithQueryParam = (newState: React.SetStateAction<DataTableFilterMeta>) => {
    setState(newState);
    const resolvedState = resolveState(newState, state);

    const currentSearchParams = new URLSearchParams(window.location.search);

    // If exists in the current searchParams, delete it
    if (currentSearchParams.has(paramName)) {
      currentSearchParams.delete(paramName);
    }
    if (!isEqual(resolvedState, defaultFilter)) {
      const encodedFilter = encodeFilterObj(resolvedState);
      currentSearchParams.append(paramName, encodedFilter);
    }

    const queryString = Array.from(currentSearchParams.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    // Update the URL without navigating
    if (queryString === '' || queryString === `${paramName}=()`) {
      navigate(window.location.pathname, { replace: true });
      return;
    }

    const newUrl = `${window.location.pathname}?${queryString}`;
    navigate(newUrl, { replace: true });
  };

  return [state, useStateWithQueryParam];
}

export function convertDataTableFilterMetaToDataFilterObject(
  filterMeta: DataTableFilterMeta,
  fields: any[],
): DataFilter[] {
  if (fields.length === 0) return [];
  const conversion = Object.entries(filterMeta).flatMap(([key, value]
  : [string, DataTableFilterMetaData | DataTableOperatorFilterMetaData]) => {
    if (isOperatorFilterMetaData(value)) {
      // Handle operator filters
      return value.constraints.map((constraint: DataTableFilterMetaData) => ({
        field: key,
        fieldType: fields
          .find((field: any) => field.columnName === key)?.primitiveType as FieldTypes,
        condition: constraint.matchMode as FilterMatchMode | CustomFilterOperators,
        value: constraint.value,
      } as DataFilter));
    }
    return [{
      field: key,
      fieldType: fields.find(field => field.columnName === key)?.primitiveType as FieldTypes,
      condition: value.matchMode as FilterMatchMode | CustomFilterOperators,
      value: value.value,
    } as DataFilter];
  });
  return conversion;
}
