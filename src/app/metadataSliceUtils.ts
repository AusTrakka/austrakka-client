import { Field, ProjectField } from '../types/dtos';
import { Sample } from '../types/sample.interface';
import { MergeAlgorithm } from '../constants/mergeAlgorithm';
import { FieldSource } from '../constants/fieldSource';
import { HAS_SEQUENCES } from '../constants/metadataConsts';

export function getFieldDetails(
  fieldNames: string[],
  fields: Field[],
): Field[] {
  return fieldNames.map(
    field => {
      const fieldDetail = fields.find(f => f.columnName === field);
      if (!fieldDetail) {
        throw new Error(
          'Unexpected error fetching metadata: ' +
          `field ${field} in data not found in expected fields`,
        );
      }
      return fieldDetail;
    },
  );
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

export function getEmptyStringColumns(data: Sample[], fields: string[]): string[] {
  if (data.length === 0) return [];

  return fields.filter(field =>
    data.every(sample => sample[field] === ''));
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

// Given sample data and field details, replace date strings with Date objects
export function replaceDateStrings(data: Sample[], fields: Field[], fieldNames: string[]) {
  const fieldDetails = getFieldDetails(fieldNames, fields);
  const dateFields = fieldDetails.filter(field => field.primitiveType === 'date');
  dateFields.forEach(field => {
    data.forEach(sample => {
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

          sample[field.columnName] = new Date(year, month, day, 0, 0, 0);
        }
      } else {
        sample[field.columnName] = null;
      }
    });
  });
}

// Given a list of field names, calculate or look up the unique values for the fields
export function calculateUniqueValues(
  fieldNames: string[],
  fields: Field[],
  data: Sample[],
) : Record<string, string[]> {
  const uniqueValues: Record<string, string[]> = {};
  const fieldDetails: Field[] = getFieldDetails(fieldNames, fields);
  // we calculate unique values for both visualisable categorical and string fields
  // this means we are ignoring validValues; values won't be in legends if not in data
  const visualisableFields = fieldDetails.filter(field =>
    field.canVisualise && (!field.primitiveType || field.primitiveType === 'string'));
  
  const valueSets : Record<string, Set<string>> = {};
  visualisableFields.forEach(field => {
    valueSets[field.columnName] = new Set();
  });
  
  data.forEach(sample => {
    visualisableFields.forEach(field => {
      const rawValue = sample[field.columnName];
      // Treat null and undefined as empty string; coerce non-strings safely
      const value = rawValue == null ? '' : rawValue.toString();
      valueSets[field.columnName].add(value);
    });
  });
  
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  
  visualisableFields.forEach(field => {
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
// for project metadata specifically

// Given a list of field names, calculate the viewFields for that field
export function calculateViewFieldNames(
  field: ProjectField,
  mergeAlgorithm: string,
): string[] {
  if (mergeAlgorithm === MergeAlgorithm.SHOW_ALL &&
      field.fieldSource === FieldSource.DATASET) {
    return (field.analysisLabels ?? []).map(label => `${field.fieldName}_${label}`);
  }
  // override mode, or fieldSource is sample, or fieldSource is both (Seq_ID)
  return [field.fieldName];
}
