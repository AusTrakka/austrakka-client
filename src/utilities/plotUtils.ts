// Pure functions used in plot pages

/* Disabling to make e.g. newSpec['encoding'][field] clearer */
/* eslint-disable @typescript-eslint/dot-notation */

import { TopLevelSpec } from 'vega-lite';

// Get the preferred field to populate a selector when fields first loaded
// If a preferred field is not of the correct type it will simply appear unavailable
export const getStartingField = (preferredFields: string[], availableFields: string[]): string => {
  for (const preferredField of preferredFields) {
    if (availableFields.includes(preferredField)) {
      return preferredField;
    }
  }
  return availableFields[0];
};

// Update a spec to replace a field value, returning the new object
export const setFieldInSpec =
(oldSpec: TopLevelSpec | null, field: string, value: string): TopLevelSpec | null => {
  if (oldSpec === null) {
    return null;
  }
  // A shallow copy of unaltered elements; replace altered
  // Note we do not change other properties of specified field, e.g. type
  const newSpec: TopLevelSpec = { ...oldSpec };
  newSpec.encoding = { ...oldSpec.encoding };
  newSpec['encoding'][field] = { ...oldSpec['encoding'][field] };
  newSpec['encoding'][field]['field'] = value;
  return newSpec;
};
