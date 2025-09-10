import { typeCodes } from '../constants/standaloneClientConstants';
import { Sample } from '../types/sample.interface';
import { DeducedField, Field } from '../types/dtos';
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
};

// TODO replace with makeStringField which looks at unique count
// TODO and here or elsewhere, check if appears to be date, numeric, boolean
// TODO if Seq_ID, make non-visualisable string field
const makeVisualisableStringField = (fieldName: string, idx: number): DeducedField => ({
  columnName: fieldName,
  primitiveType: 'string',
  metaDataColumnTypeName: 'string',
  metaDataColumnValidValues: null,
  canVisualise: true,
  columnOrder: idx,
  displayedFieldType: 'Categorical',
  fieldTypeSource: 'Deduced',
});

function makeField(fieldName: string, idx: number, typeCode: string) {
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
    };
  }
  // TODO should be user-facing error message
  console.error(`Ignoring unknown type code ${typeCode} on field ${fieldName}`);
  return makeVisualisableStringField(fieldName, idx);
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
      fields.push(makeField(newFieldName, idx, typeCode));
      renamedFields.push([fieldName, newFieldName]);
    } else {
      // No pattern match; no type code
      if (fieldName === SAMPLE_ID_FIELD) {
        fields.push(SAMPLE_ID_FIELD_OBJECT);
      } else {
        // For now defaulting to a visualisable string field if no type hint
        fields.push(makeVisualisableStringField(fieldName, idx));
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
