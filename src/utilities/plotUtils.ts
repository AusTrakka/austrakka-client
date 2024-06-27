// Pure functions used in plot pages

/* Disabling to make e.g. newSpec['encoding'][field]['field'] clearer */
/* eslint-disable @typescript-eslint/dot-notation */

import { TopLevelSpec } from 'vega-lite';
import { createColourMapping } from './colourUtils';

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
export const setFieldInSpec
= (oldSpec: TopLevelSpec | null, field: string, value: string): TopLevelSpec | null => {
  // Note that we cast TopLevelSpecs to any here as .encoding is not guaranteed on TopLevelSpec.
  // We are reliant on using specs which do have .encoding, but more specific types are not
  // currently exported from vega-lite for us to assert this.
  if (oldSpec === null) {
    return null;
  }
  // A shallow copy of unaltered elements; replace altered
  // Note we do not change other properties of specified field, e.g. type
  const newSpec: any = { ...oldSpec };
  newSpec.encoding = { ...(oldSpec as any).encoding };
  newSpec['encoding'][field] = { ...(oldSpec as any)['encoding'][field] };
  newSpec['encoding'][field]['field'] = value;
  return newSpec as TopLevelSpec;
};

export const legendSpec = {
  orient: 'bottom',
  columns: 6,
  symbolLimit: 0, // no limit
  labelExpr: "datum.label || 'null'",
};

// Takes in the known set of unique values for the field and uses these for our own colour mapping
//   and legend sort order (override Vega's non-natural-sort order)
export const setColorInSpecToValue = (
  oldSpec: TopLevelSpec | null,
  colourField: string,
  uniqueValues: string[],
  colourScheme: string = 'spectral',
): TopLevelSpec | null => {
  if (oldSpec == null) return null;
  const newSpec: any = { ...oldSpec };
  if (colourField === 'none') {
    // Remove colour from encoding
    const { color, ...newEncoding } = (oldSpec as any).encoding;
    newSpec.encoding = newEncoding;
  } else {
    // Set colour in encoding
    const colourMapping = createColourMapping(uniqueValues, colourScheme);
    newSpec.encoding = { ...(oldSpec as any).encoding };
    newSpec.encoding.color = {
      field: colourField,
      scale: {
        domain: uniqueValues,
        range: uniqueValues.map((val) => colourMapping[val]),
      },
      legend: legendSpec,
    };
  }
  return newSpec as TopLevelSpec;
};

export const setColorAggregateInSpecToValue = (
  oldSpec: TopLevelSpec | null,
  colourScheme: string = 'spectral',
): TopLevelSpec | null => {
  if (oldSpec == null) return null;
  const newSpec: any = { ...oldSpec };
  newSpec.encoding = { ...(oldSpec as any).encoding };
  newSpec.encoding.color = {
    aggregate: 'count',
    scale: {
      scheme: colourScheme,
    },
    legend: legendSpec,
  };

  return newSpec as TopLevelSpec;
};

// Facet row. Does not use generic setFieldInSpec, as we handle 'none'
export const setRowInSpecToValue =
    (oldSpec: TopLevelSpec | null, rowField: string): TopLevelSpec | null => {
      if (oldSpec == null) return null;
      const newSpec: any = { ...oldSpec };
      if (rowField === 'none') {
        // Remove row from encoding
        const { row, ...newEncoding } = (oldSpec as any).encoding;
        newSpec.encoding = newEncoding;
      } else {
        // Set row in encoding
        newSpec.encoding = { ...(oldSpec as any).encoding };
        newSpec.encoding.row = {
          field: rowField,
        };
      }
      return newSpec as TopLevelSpec;
    };
