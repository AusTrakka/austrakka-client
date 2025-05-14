import { typeCodes } from '../constants/standaloneClientConstants';
import { Sample } from '../types/sample.interface';
import { Field } from '../types/dtos';

// TODO replace with makeStringField which looks at unique count
// TODO and here or elsewhere, check if appears to be date, numeric, boolean
// TODO if Seq_ID, make non-visualisable string field
const makeVisualisableStringField = (fieldName: string, idx: number): Field => ({
  columnName: fieldName,
  primitiveType: 'string',
  metaDataColumnTypeName: 'string',
  metaDataColumnValidValues: null,
  canVisualise: true,
  columnOrder: idx,
});

function makeField(fieldName: string, idx: number, typeCode: string) {
  // TODO if Seq_ID, warn if weird type code
  if (typeCode in typeCodes) {
    const [primitiveType, canVisualise] = typeCodes[typeCode];
    return {
      columnName: fieldName,
      primitiveType,
      metaDataColumnTypeName: primitiveType,
      metaDataColumnValidValues: null,
      canVisualise,
      columnOrder: idx,
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
) : Field[] {
  const fieldTypePattern = /^(\w+):(\w)$/;
  const fields : Field[] = [];
  const renamedFields : [string, string][] = [];
  fieldNames.forEach((fieldName, idx) => {
    const fieldTypeMatch = fieldName.match(fieldTypePattern);
    if (fieldTypeMatch) {
      const [_wholeName, newFieldName, typeCode] = fieldTypeMatch;
      fields.push(makeField(newFieldName, idx, typeCode));
      renamedFields.push([fieldName, newFieldName]);
    } else {
      // For now defaulting to a visualisable string field if no type hint
      fields.push(makeVisualisableStringField(fieldName, idx));
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
