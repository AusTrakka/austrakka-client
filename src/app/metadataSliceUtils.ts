import { MapRegistry, type MapSupportInfo } from '../components/Maps/mapMeta';
import { FieldSource } from '../constants/fieldSource';
import { FieldTypes } from '../constants/fieldTypes';
import { MergeAlgorithm } from '../constants/mergeAlgorithm';
import { HAS_SEQUENCES } from '../constants/metadataConsts';
import type { Field, ProjectField } from '../types/dtos';
import type { Sample } from '../types/sample.interface';
import { findSupplement, getCountryCode, isSubdivision } from '../utilities/mapUtils';

export function getFieldDetails(fieldNames: string[], fields: Field[]): Field[] {
  return fieldNames.map((field) => {
    const fieldDetail = fields.find((f) => f.columnName === field);
    if (!fieldDetail) {
      throw new Error(
        'Unexpected error fetching metadata: ' +
          `field ${field} in data not found in expected fields`,
      );
    }
    return fieldDetail;
  });
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

export function insertUnpopulatedOverrideFields(
  data: Sample[],
  projectFields: ProjectField[],
  viewFields: string[],
): void {
  const currentFields = projectFields.filter(
    (field) => viewFields.includes(field.fieldName) && field.fieldSource === FieldSource.DATASET,
  );

  const missingFields = currentFields.filter(
    (field) => !data.some((sample) => field.fieldName in sample),
  );

  missingFields.forEach((field) => {
    data.forEach((sample) => {
      sample[field.fieldName] = '';
    });
  });
}

export function getEmptyStringColumns(data: Sample[], fields: string[]): string[] {
  if (data.length === 0) return [];

  return fields.filter((field) => data.every((sample) => sample[field] === ''));
}

export function replaceHasSequencesNullsWithFalse(data: Sample[]) {
  data.map((sample) => {
    if (sample[HAS_SEQUENCES] === null || sample[HAS_SEQUENCES] === '') {
      sample[HAS_SEQUENCES] = false;
    }
    return sample;
  });

  return data;
}

export function normaliseHasSequencesTrueBoolWithString(data: Sample[]) {
  data.map((sample) => {
    if (sample[HAS_SEQUENCES] === 'True' || sample[HAS_SEQUENCES] === true) {
      sample[HAS_SEQUENCES] = 'True';
    }
    return sample;
  });

  return data;
}

// Given sample data and field details, replace int strings with int values
export function replaceIntStrings(data: Sample[], fields: Field[], fieldNames: string[]) {
  const fieldDetails = getFieldDetails(fieldNames, fields);
  const intFields = fieldDetails.filter(
    (field) =>
      field.primitiveType === FieldTypes.NUMBER || field.primitiveType === FieldTypes.DOUBLE,
  );
  intFields.forEach((field) => {
    data.forEach((sample) => {
      const intString = sample[field.columnName];
      if (intString !== null && intString !== undefined && intString !== '') {
        const num = Number(intString);
        sample[field.columnName] = Number.isNaN(num) ? null : num;
      } else {
        sample[field.columnName] = null;
      }
    });
  });
}

// Given sample data and field details, replace date strings with Date objects
export function replaceDateStrings(data: Sample[], fields: Field[], fieldNames: string[]) {
  const fieldDetails = getFieldDetails(fieldNames, fields);
  const dateFields = fieldDetails.filter((field) => field.primitiveType === 'date');
  dateFields.forEach((field) => {
    data.forEach((sample) => {
      const dateString = sample[field.columnName];

      // Date filter function dont handle strings thus making null if it is empty
      if (dateString && dateString !== '') {
        const isISOFormat = dateString.includes('T');

        if (isISOFormat) {
          // If it's in ISO format, create a new Date object directly from the dateString
          sample[field.columnName] = new Date(dateString);
        } else {
          // If it's a regular date string, parse the components and create a new Date object
          const year = parseInt(dateString.slice(0, 4), 10);
          const month = parseInt(dateString.slice(5, 7), 10) - 1; // Months are zero-based
          const day = parseInt(dateString.slice(8, 10), 10);

          sample[field.columnName] = new Date(Date.UTC(year, month, day, 0, 0, 0));
        }
      } else {
        sample[field.columnName] = null;
      }
    });
  });
}

export function compareDatesDesc(aDate: Date | null, bDate: Date | null): number {
  if (!aDate && !bDate) return 0;
  if (!aDate) return 1;
  if (!bDate) return -1;

  return bDate.getTime() - aDate.getTime();
}

// Given a list of field names, calculate or look up the unique values for the fields
export function calculateUniqueValues(
  fieldNames: string[],
  fields: Field[],
  data: Sample[],
): Record<string, string[]> {
  const uniqueValues: Record<string, string[]> = {};
  const fieldDetails: Field[] = getFieldDetails(fieldNames, fields);
  // we calculate unique values for both visualisable categorical and string fields
  // this means we are ignoring validValues; values won't be in legends if not in data
  const visualisableFields = fieldDetails.filter(
    (field) => field.canVisualise && (!field.primitiveType || field.primitiveType === 'string'),
  );

  const valueSets: Record<string, Set<string>> = {};
  visualisableFields.forEach((field) => {
    valueSets[field.columnName] = new Set();
  });

  data.forEach((sample) => {
    visualisableFields.forEach((field) => {
      const rawValue = sample[field.columnName];
      // Treat null and undefined as empty string; coerce non-strings safely
      const value = rawValue == null ? '' : rawValue.toString();
      valueSets[field.columnName].add(value);
    });
  });

  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

  visualisableFields.forEach((field) => {
    const values = Array.from(valueSets[field.columnName]);

    // Remove a single [""] array case
    if (values.length === 1 && values[0] === '') {
      uniqueValues[field.columnName] = [];
    } else {
      // sort
      uniqueValues[field.columnName] = values.sort(collator.compare);
    }
  });

  return uniqueValues;
}

// Calculate what Maps this project has access too
export function calculateSupportedMaps(
  uniqueValues: Record<string, string[]>,
  geoFields: string[],
): MapSupportInfo[] {
  if (geoFields.length === 0) return [];

  const datasetKeys = new Set<string>();
  const datasetRegions = new Set<string>();
  let hasCountryValues = false;

  for (const field of geoFields) {
    for (const value of uniqueValues[field] ?? []) {
      if (!value) continue;
      const standard = getCountryCode(value);
      if (!standard) continue;

      datasetKeys.add(standard);
      if (isSubdivision(value)) {
        datasetRegions.add(value.slice(0, 2));
      } else {
        hasCountryValues = true;
      }
    }
  }

  const result: MapSupportInfo[] = [];

  for (const entry of MapRegistry) {
    if (entry.key === 'WORLD') {
      if (hasCountryValues) result.push([entry.key, false]);
      continue;
    }

    const hasSupplement = geoFields.some((field) => findSupplement(entry.key, field));
    const intersects = [...datasetKeys].some((key) => entry.supports?.has(key));
    if (!intersects && !hasSupplement) continue;

    const hasRegions =
      hasSupplement || [...datasetRegions].some((region) => entry.supports?.has(region));
    result.push([entry.key, hasRegions]);
  }

  return result;
}

// Given a list of field names, calculate the viewFields for that field
export function calculateViewFieldNames(field: ProjectField, mergeAlgorithm: string): string[] {
  if (mergeAlgorithm === MergeAlgorithm.SHOW_ALL && field.fieldSource === FieldSource.DATASET) {
    return (field.analysisLabels ?? []).map((label) => `${field.fieldName}_${label}`);
  }
  // override mode, or fieldSource is sample, or fieldSource is both (Seq_ID)
  return [field.fieldName];
}
