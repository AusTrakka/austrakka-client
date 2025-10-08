import { Field } from '../../../src/types/dtos';
import { Sample } from '../../../src/types/sample.interface';
import { calculateUniqueValues } from '../../../src/app/metadataSliceUtils';

describe('calculateUniqueValues', () => {
  const fields: Field[] = [
    {
      columnName: 'visualisableStringField',
      primitiveType: 'string',
      metaDataColumnTypeName: 'string',
      metaDataColumnValidValues: [],
      canVisualise: true,
      geoField: false,
      columnOrder: 1,
    },
    {
      columnName: 'nonVisualisableStringField',
      primitiveType: 'date',
      metaDataColumnTypeName: 'date',
      metaDataColumnValidValues: [],
      canVisualise: false,
      geoField: false,
      columnOrder: 2,
    },
    {
      columnName: 'datefield',
      primitiveType: 'date',
      metaDataColumnTypeName: 'date',
      metaDataColumnValidValues: [],
      canVisualise: true,
      geoField: false,
      columnOrder: 3,
    },
    {
      columnName: 'categoricalfield',
      primitiveType: null,
      metaDataColumnTypeName: 'CategoricalFieldType',
      metaDataColumnValidValues: ['val1', 'val2', 'val3'],
      canVisualise: true,
      geoField: false,
      columnOrder: 4,
    },
  ];

  describe('when data is empty', () => {
    const data: Sample[] = [];

    test('string fields should return empty list of unique values', () => {
      const fieldNames = ['visualisableStringField'];
      const result = calculateUniqueValues(fieldNames, fields, data);
      expect(result).toEqual({ visualisableStringField: [] });
    });
    // If we wanted categorical fields to use validValues, this test would change
    test('category fields should return empty list of unique values', () => {
      const fieldNames = ['categoricalfield'];
      const result = calculateUniqueValues(fieldNames, fields, data);
      expect(result).toEqual({ categoricalfield: [] });
    });
  });

  describe('when data is not empty, or in general', () => {
    const data: Sample[] = [
      { visualisableStringField: 'a', nonVisualisableStringField: 'a', datefield: new Date('2021-01-01'), categoricalfield: 'val1' },
      { visualisableStringField: 'a', nonVisualisableStringField: 'b', datefield: new Date('2021-01-01'), categoricalfield: 'val2' },
      { visualisableStringField: 'c', nonVisualisableStringField: 'b', datefield: new Date('2021-01-03'), categoricalfield: 'val2' },
      { visualisableStringField: 'd', nonVisualisableStringField: 'd', datefield: new Date('2021-01-04'), categoricalfield: 'val1' },
    ];

    test('field names not in data should throw an error', () => {
      const fieldNames = ['nonExistentField'];
      expect(() => calculateUniqueValues(fieldNames, fields, data)).toThrow();
    });
    test('date fields should be ignored', () => {
      const fieldNames = ['datefield'];
      const result = calculateUniqueValues(fieldNames, fields, data);
      expect(result).toEqual({});
    });
    test('non-visualisable fields should be ignored', () => {
      const fieldNames = ['nonVisualisableStringField'];
      const result = calculateUniqueValues(fieldNames, fields, data);
      expect(result).toEqual({});
    });
    test('string fields should return list of unique values', () => {
      const fieldNames = ['visualisableStringField'];
      const result = calculateUniqueValues(fieldNames, fields, data);
      expect(result).toEqual({ visualisableStringField: ['a', 'c', 'd'] });
    });
    // If we wanted categorical fields to use validValues, this test might change
    test('category fields should return list of unique values', () => {
      const fieldNames = ['categoricalfield'];
      const result = calculateUniqueValues(fieldNames, fields, data);
      expect(result).toEqual({ categoricalfield: ['val1', 'val2'] });
    });
    test('empty and null values should be included as empty strings', () => {
      const localData: Sample[] = data.concat([
        { visualisableStringField: '', nonVisualisableStringField: '', datefield: null, categoricalfield: null },
        { visualisableStringField: null, nonVisualisableStringField: null, datefield: null, categoricalfield: '' },
      ]);
      const fieldNames = ['visualisableStringField', 'categoricalfield'];
      const result = calculateUniqueValues(fieldNames, fields, localData);
      expect(result).toEqual({
        visualisableStringField: ['', 'a', 'c', 'd'],
        categoricalfield: ['', 'val1', 'val2'],
      });
    });
  });
});
