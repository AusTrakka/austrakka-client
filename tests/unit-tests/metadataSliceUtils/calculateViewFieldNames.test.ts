import { ProjectField } from '../../../src/types/dtos';
import { MergeAlgorithm } from '../../../src/constants/mergeAlgorithm';
import { FieldSource } from '../../../src/constants/fieldSource';
import { calculateViewFieldNames } from '../../../src/app/metadataSliceUtils';

describe('calculateViewFieldNames', () => {
  test('given fieldSource is sample, should return the unaltered field name', () => {
    const field: ProjectField = {
      projectFieldId: 1,
      fieldName: 'field',
      primitiveType: 'string',
      metaDataColumnTypeName: 'text',
      fieldSource: FieldSource.SAMPLE,
      columnOrder: 1,
      canVisualise: true,
      metaDataColumnValidValues: null,
      analysisLabels: ['a1', 'a2'],
      createdBy: 'admin',
    };
    const mergeAlgorithm = MergeAlgorithm.SHOW_ALL;
    const result = calculateViewFieldNames(field, mergeAlgorithm);
    expect(result).toEqual(['field']);
  });
  
  test('given fieldSource is both, should return the unaltered field name', () => {
    const field: ProjectField = {
      projectFieldId: 1,
      fieldName: 'field',
      primitiveType: 'string',
      metaDataColumnTypeName: 'text',
      fieldSource: FieldSource.BOTH,
      columnOrder: 1,
      canVisualise: true,
      metaDataColumnValidValues: null,
      analysisLabels: ['a1', 'a2'],
      createdBy: 'admin',
    };
    const mergeAlgorithm = MergeAlgorithm.SHOW_ALL;
    const result = calculateViewFieldNames(field, mergeAlgorithm);
    expect(result).toEqual(['field']);
  });
  
  test('given mergeAlgorithm is override, then even if field source is dataset, should return the unaltered field name', () => {
    const field: ProjectField = {
      projectFieldId: 1,
      fieldName: 'field',
      primitiveType: 'string',
      metaDataColumnTypeName: 'text',
      fieldSource: FieldSource.DATASET,
      columnOrder: 1,
      canVisualise: true,
      metaDataColumnValidValues: null,
      analysisLabels: ['a1', 'a2'],
      createdBy: 'admin',
    };
    const mergeAlgorithm = MergeAlgorithm.OVERRIDE;
    const result = calculateViewFieldNames(field, mergeAlgorithm);
    expect(result).toEqual(['field']);
  });
  
  test('given mergeAlgorithm is show all and field source is dataset, should return field name with analysis labels', () => {
    const field: ProjectField = {
      projectFieldId: 1,
      fieldName: 'field',
      primitiveType: 'string',
      metaDataColumnTypeName: 'text',
      fieldSource: FieldSource.DATASET,
      columnOrder: 1,
      canVisualise: true,
      metaDataColumnValidValues: null,
      analysisLabels: ['a1', 'a2'],
      createdBy: 'admin',
    };
    const mergeAlgorithm = MergeAlgorithm.SHOW_ALL;
    const result = calculateViewFieldNames(field, mergeAlgorithm);
    expect(result).toEqual(['field_a1', 'field_a2']);
  });
});
