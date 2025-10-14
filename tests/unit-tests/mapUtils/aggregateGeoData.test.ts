import { FeatureLookupField, FeatureLookupFieldType, MapJson } from '../../../src/components/Maps/mapMeta';
import { aggregateGeoData } from '../../../src/utilities/mapUtils';

describe('aggregateGeoData', () => {
  const makeGeoJSON = (values: string[], field: FeatureLookupFieldType): MapJson => ({
    type: 'FeatureCollection',
    features: values.map((v) => ({
      type: 'Feature',
      properties: { [field]: v },
    })),
  } as any);

  const field = {
    columnName: 'country',
    primitiveType: null,
    metaDataColumnTypeName: '',
    metaDataColumnValidValues: null,
    canVisualise: true,
    geoField: true,
    columnOrder: 0,
  };

  describe('when no data is provided', () => {
    test('returns empty when geoJSON is null', () => {
      const result = aggregateGeoData([{ country: 'AUS' }], field, null as any, FeatureLookupField.NAME);
      expect(result).toEqual({ counts: [], missing: [] });
    });

    test('returns empty when samples are null', () => {
      const geoJSON = makeGeoJSON(['AUS'], FeatureLookupField.NAME);
      const result = aggregateGeoData(null as any, field, geoJSON, FeatureLookupField.NAME);
      expect(result).toEqual({ counts: [], missing: [] });
    });

    test('returns empty when samples are empty array', () => {
      const geoJSON = makeGeoJSON(['AUS'], FeatureLookupField.NAME);
      const result = aggregateGeoData([], field, geoJSON, FeatureLookupField.NAME);
      expect(result).toEqual({ counts: [], missing: [] });
    });

    test('returns empty when geoJSON has no features', () => {
      const geoJSON = { type: 'FeatureCollection', features: [] } as any;
      const result = aggregateGeoData([{ country: 'AUS' }], field, geoJSON, FeatureLookupField.NAME);
      expect(result).toEqual({ counts: [], missing: [] });
    });
  });

  describe('when all samples match expected values', () => {
    test('increments counts correctly', () => {
      const geoJSON = makeGeoJSON(['AUS', 'NZ'], FeatureLookupField.NAME);
      const samples = [
        { country: 'AUS' },
        { country: 'AUS' },
        { country: 'NZ' },
      ];
      const result = aggregateGeoData(samples, field, geoJSON, FeatureLookupField.NAME);
      expect(result.counts).toEqual(expect.arrayContaining([
        { geoFeature: 'AUS', count: 2 },
        { geoFeature: 'NZ', count: 1 },
      ]));
      expect(result.missing).toEqual([]);
    });
  });

  describe('when samples contain values not in geoJSON', () => {
    test('puts unexpected values into missing', () => {
      const geoJSON = makeGeoJSON(['AUS'], FeatureLookupField.NAME);
      const samples = [
        { country: 'AUS' },
        { country: 'XYZ' },
      ];
      const result = aggregateGeoData(samples, field, geoJSON, FeatureLookupField.NAME);
      expect(result.counts).toEqual(expect.arrayContaining([
        { geoFeature: 'AUS', count: 1 },
      ]));
      expect(result.missing).toEqual(expect.arrayContaining([
        { geoFeature: 'XYZ', count: 1 },
      ]));
    });
  });

  describe('when samples have undefined or null values', () => {
    test('ignores missing keys', () => {
      const geoJSON = makeGeoJSON(['AUS'], FeatureLookupField.NAME);
      const samples = [
        { other: 'notCountry' },
        { country: undefined },
        { country: null },
      ];
      const result = aggregateGeoData(samples, field, geoJSON, FeatureLookupField.NAME);
      expect(result).toEqual({
        counts: [{ geoFeature: 'AUS', count: 0 }],
        missing: [],
      });
    });
  });

  describe('when geoJSON contains duplicate expected values', () => {
    test('throws an error', () => {
      const geoJSON = {
        type: 'FeatureCollection',
        features: [
          { type: 'Feature', properties: { name: 'AUS' } },
          { type: 'Feature', properties: { name: 'AUS' } }, // duplicate
        ],
      } as any;
      const samples = [{ country: 'AUS' }];
      expect(() =>
        aggregateGeoData(samples, field, geoJSON, FeatureLookupField.NAME)).toThrow();
    });
  });

  describe('when mixing expected and unexpected values', () => {
    test('populates both counts and missing', () => {
      const geoJSON = makeGeoJSON(['AUS', 'NZ'], FeatureLookupField.NAME);
      const samples = [
        { country: 'AUS' },
        { country: 'XYZ' },
      ];
      const result = aggregateGeoData(samples, field, geoJSON, FeatureLookupField.NAME);
      expect(result.counts).toEqual(expect.arrayContaining([
        { geoFeature: 'AUS', count: 1 },
        { geoFeature: 'NZ', count: 0 },
      ]));
      expect(result.missing).toEqual(expect.arrayContaining([
        { geoFeature: 'XYZ', count: 1 },
      ]));
    });
  });

  describe('when sample type mismatches geoJSON values', () => {
    test('treats string and number as different keys', () => {
      const geoJSON = makeGeoJSON(['1'], FeatureLookupField.NAME);
      const samples = [{ country: 1 }];
      const result = aggregateGeoData(samples, field, geoJSON, FeatureLookupField.NAME);
      expect(result.counts).toEqual(expect.arrayContaining([
        { geoFeature: '1', count: 1 },
      ]));
      expect(result.missing).toEqual([]);
    });
  });
});
