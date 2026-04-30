import { insertUnpopulatedOverrideFields } from '../../../src/app/metadataSliceUtils';
import { FieldSource } from '../../../src/constants/fieldSource';
import type { ProjectField } from '../../../src/types/dtos';
import type { Sample } from '../../../src/types/sample.interface';

describe('insertUnpopulatedOverrideFields', () => {
  const projectFields: ProjectField[] = [
    {
      projectFieldId: 1,
      fieldName: 'country',
      primitiveType: 'string',
      metaDataColumnTypeName: 'string',
      fieldSource: FieldSource.DATASET,
      columnOrder: 1,
      canVisualise: true,
      geoField: false,
      hidden: false,
      metaDataColumnValidValues: null,
      analysisLabels: [],
      createdBy: 'admin',
    },
    {
      projectFieldId: 2,
      fieldName: 'collectionDate',
      primitiveType: 'date',
      metaDataColumnTypeName: 'date',
      fieldSource: FieldSource.DATASET,
      columnOrder: 2,
      canVisualise: false,
      geoField: false,
      hidden: false,
      metaDataColumnValidValues: null,
      analysisLabels: [],
      createdBy: 'admin',
    },
    {
      projectFieldId: 3,
      fieldName: 'overrideField',
      primitiveType: 'string',
      metaDataColumnTypeName: 'string',
      fieldSource: FieldSource.SAMPLE,
      columnOrder: 3,
      canVisualise: true,
      geoField: false,
      hidden: false,
      metaDataColumnValidValues: null,
      analysisLabels: [],
      createdBy: 'admin',
    },
  ];

  describe('when data is empty', () => {
    test('no mutation should occur when data has no samples', () => {
      const data: Sample[] = [];
      insertUnpopulatedOverrideFields(data, projectFields, ['country', 'collectionDate']);
      expect(data).toHaveLength(0);
    });
  });

  describe('when data has samples but fields are missing', () => {
    test('missing dataset fields present in viewFields should be inserted as empty string on each sample', () => {
      const data: Sample[] = [{ existingField: 'value' }, { existingField: 'other' }];
      insertUnpopulatedOverrideFields(data, projectFields, ['country']);
      expect(data[0]).toHaveProperty('country', '');
      expect(data[1]).toHaveProperty('country', '');
    });

    test('existing fields should not be overwritten', () => {
      const data: Sample[] = [{ country: 'Australia' }, { country: 'New Zealand' }];
      insertUnpopulatedOverrideFields(data, projectFields, ['country']);
      expect(data[0].country).toBe('Australia');
      expect(data[1].country).toBe('New Zealand');
    });

    test('multiple missing dataset fields should all be inserted', () => {
      const data: Sample[] = [{ existingField: 'value' }];
      insertUnpopulatedOverrideFields(data, projectFields, ['country', 'collectionDate']);
      expect(data[0]).toHaveProperty('country', '');
      expect(data[0]).toHaveProperty('collectionDate', '');
    });
  });

  describe('when fields are not sourced from dataset', () => {
    test('override sourced fields should not be inserted even if missing from data', () => {
      const data: Sample[] = [{ existingField: 'value' }];
      insertUnpopulatedOverrideFields(data, projectFields, ['overrideField']);
      expect(data[0]).not.toHaveProperty('overrideField');
    });
  });

  describe('when viewFields does not match projectFields', () => {
    test('fields not present in viewFields should not be inserted', () => {
      const data: Sample[] = [{ existingField: 'value' }];
      insertUnpopulatedOverrideFields(data, projectFields, []);
      expect(data[0]).not.toHaveProperty('country');
      expect(data[0]).not.toHaveProperty('collectionDate');
    });

    test('field names not matching any project field should be silently ignored', () => {
      const data: Sample[] = [{ existingField: 'value' }];
      insertUnpopulatedOverrideFields(data, projectFields, ['nonExistentField']);
      expect(data[0]).not.toHaveProperty('nonExistentField');
    });
  });
});
