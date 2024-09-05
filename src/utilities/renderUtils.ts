import { isoDateLocalDate, isoDateLocalDateNoTime } from './dateUtils';
import { Sample } from '../types/sample.interface';
import { HAS_SEQUENCES } from '../constants/metadataConsts';

export const renderValueWithEmptyNull = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
};
// Maps from a hard-coded metadata field name to a function to render the data value
// Note that some datetime fields are included here in order to render them as datetime,
// not just dates, which is the type default below. Ideally the server should tell us
// whether a field is a date or a datetime.
export const fieldRenderFunctions: { [index: string]: Function } = {
  'Shared_groups': (value: any) => {
    if (value === null || value === undefined) return '';

    // 1. Remove unwanted characters (optional)
    const sanitizedValue = value.toString().replace(/[[\]"']/g, '');

    // 2. Replace commas with comma and space
    // Return the formatted value
    return sanitizedValue.replace(/,/g, ', ');
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
