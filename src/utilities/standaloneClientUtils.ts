import { typeCodes, UNIQUE_VALUE_THRESHOLD } from '../constants/standaloneClientConstants';
import { Sample } from '../types/sample.interface';
import { DeducedField } from '../types/dtos';
import { SAMPLE_ID_FIELD } from '../constants/metadataConsts';

// Special handling for Seq_ID
const SAMPLE_ID_FIELD_OBJECT: DeducedField = {
  columnName: SAMPLE_ID_FIELD,
  primitiveType: 'string',
  metaDataColumnTypeName: 'string',
  metaDataColumnValidValues: null,
  canVisualise: false,
  columnOrder: 0,
  displayedFieldType: 'Free text',
  fieldTypeSource: 'Primary ID',
  geoField: false,
};

function makeDeducedField(data: Sample[], fieldName: string, idx :number = 0) : DeducedField {
  if (fieldName === SAMPLE_ID_FIELD) {
    return SAMPLE_ID_FIELD_OBJECT;
  }
  const typeCode = deduceFieldType(data, fieldName);
  const [primitiveType, canVisualise, displayedType] = typeCodes[typeCode];
  return {
    columnName: fieldName,
    primitiveType,
    metaDataColumnTypeName: primitiveType,
    metaDataColumnValidValues: null,
    canVisualise,
    columnOrder: idx,
    displayedFieldType: displayedType,
    fieldTypeSource: 'Deduced',
    geoField: false, // TODO need to support this through type deduction / user-specified types
  };
}

function makeField(data: Sample[], fieldName: string, idx: number, typeCode: string) {
  if (fieldName === SAMPLE_ID_FIELD) {
    // TODO if Seq_ID, warn if weird type code; we are ignoring it
    return SAMPLE_ID_FIELD_OBJECT;
  }
  if (typeCode in typeCodes) {
    const [primitiveType, canVisualise, displayedType] = typeCodes[typeCode];
    return {
      columnName: fieldName,
      primitiveType,
      metaDataColumnTypeName: primitiveType,
      metaDataColumnValidValues: null,
      canVisualise,
      columnOrder: idx,
      displayedFieldType: displayedType,
      fieldTypeSource: 'Header',
      geoField: false,
    };
  }
  // TODO should be user-facing error message
  console.error(`Ignoring unknown type code ${typeCode} on field ${fieldName}`);
  return makeDeducedField(data, fieldName, idx);
}

// Note this function is not pure; the original data is modified
export function buildFieldListAndUpdateData(
  data: Sample[],
  fieldNames: string[],
) : DeducedField[] {
  const fieldTypePattern = /^(\w+):(\w)$/;
  const fields : DeducedField[] = [];
  const renamedFields : [string, string][] = [];
  fieldNames.forEach((fieldName, idx) => {
    const fieldTypeMatch = fieldName.match(fieldTypePattern);
    if (fieldTypeMatch) {
      const [_wholeName, newFieldName, typeCode] = fieldTypeMatch;
      fields.push(makeField(data, newFieldName, idx, typeCode));
      renamedFields.push([fieldName, newFieldName]);
    } else {
      // No pattern match; no type code
      if (fieldName === SAMPLE_ID_FIELD) {
        fields.push(SAMPLE_ID_FIELD_OBJECT);
      } else {
        // For now defaulting to a visualisable string field if no type hint
        fields.push(makeDeducedField(data, fieldName, idx));
      }
    }
  });
  if (renamedFields.length > 0) {
    // This changes data in-place
    data.forEach((sample) => {
      renamedFields.forEach(([oldFieldName, newFieldName]) => {
        const value = sample[oldFieldName];
        delete sample[oldFieldName];
        sample[newFieldName] = value;
      });
    });
  }
  
  return fields;
}

function deduceFieldType(data: Sample[], fieldName: string): string {
  let isNumeric = true;
  let isDate = true;
  for (let i = 0; i < data.length; i++) {
    const value = data[i][fieldName];
    if (value === null || value === undefined || value === '') {
      continue; // skip null/undefined/empty values
    }
    // Check for numeric
    if (isNumeric && isNaN(Number(value))) {
      isNumeric = false;
    }
    // Check for date (ISO 8601 format)
    if (isDate && isNaN(Date.parse(value))) { // TODO check, risky if American dates?
      isDate = false;
    }
    // Early exit if both are false
    if (!isNumeric && !isDate) {
      break;
    }
  }
  if (isNumeric) return 'Q'; // Quantitative
  if (isDate) return 'T'; // Temporal
  if (countUniqueValues(data, fieldName) <= UNIQUE_VALUE_THRESHOLD) return 'N'; // Nominal
  return 'X'; // Free-text; do not try to visualise as categorical
}

function countUniqueValues(data: Sample[], fieldName: string): number {
  const uniqueValues = new Set<string>();
  data.forEach((sample) => {
    const value = sample[fieldName];
    if (value !== null && value !== undefined && value !== '') {
      uniqueValues.add(value);
    }
  });
  return uniqueValues.size;
}
