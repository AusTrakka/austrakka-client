import { isoDateLocalDate, isoDateLocalDateNoTime } from './dateUtils';

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

export function bytesToMB(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0';
  return (bytes / (1024 * 1024)).toString();
}
