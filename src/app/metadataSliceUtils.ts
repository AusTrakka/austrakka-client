import { Field, ProjectField } from '../types/dtos';
import { Sample } from '../types/sample.interface';
import { MergeAlgorithm } from '../constants/mergeAlgorithm';
import { FieldSource } from '../constants/fieldSource';
import { HAS_SEQUENCES } from '../constants/metadataConsts';
import { MapRegistry, MapSupportInfo } from '../components/Maps/mapMeta';

export function standardise(code: string): string | null {
  if (!code) return null;
  const upperCaseIso = code.trim().toUpperCase();

  // Subdivision like AU-NSW → keep prefix
  if (/^[A-Z]{2}-/.test(upperCaseIso)) {
    return upperCaseIso.slice(0, 2);
  }

  // ISO2
  if (/^[A-Z]{2}$/.test(upperCaseIso)) {
    return upperCaseIso;
  }

  // ISO3
  if (/^[A-Z]{3}$/.test(upperCaseIso)) {
    return upperCaseIso;
  }

  return null; // unsupported/invalid
}

function isSubdivision(code: string): boolean {
  return /^[A-Z]{2}-/.test(code.toUpperCase());
}

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

// Calculate what Maps this project has access too

export function calculateSupportedMaps(
  uniqueValues: Record<string, string[]>,
  geoFields: string[],
): MapSupportInfo[] {
  if (Object.keys(uniqueValues).length === 0) return [];
  if (geoFields.length === 0) return [];

  const uniqueGeoValues = Object.fromEntries(
    Object.entries(uniqueValues).filter(([key]) => geoFields.includes(key)),
  );

  if (Object.keys(uniqueGeoValues).length === 0) return [];

  const datasetKeys = new Set<string>();
  const datasetRegions = new Set<string>();
  let hasCountryValues = false;

  for (const uniqueVals of Object.values(uniqueGeoValues)) {
    for (const val of uniqueVals) {
      if (val === null || val === '') continue;
      if (isSubdivision(val)) {
        datasetRegions.add(val.slice(0, 2)); // e.g. "AU" from "AU-NSW"
      } else {
        hasCountryValues = true; // found a top-level country
      }

      const standard = standardise(val);
      if (standard) datasetKeys.add(standard);
    }
  }

  if (datasetKeys.size === 0) return [];

  const result: MapSupportInfo[] = [];

  for (const entry of MapRegistry) {
    if (entry.key === 'WORLD') continue;

    const intersects = [...datasetKeys].some(k => entry.supports?.has(k));
    if (intersects) {
      const hasRegions = [...datasetRegions].some(r => entry.supports?.has(r));
      result.push([entry.key, hasRegions]);
    }
  }

  // Only add WORLD if there were actual country values
  if (hasCountryValues) {
    result.push(['WORLD', false]);
  }

  return result;
}

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
