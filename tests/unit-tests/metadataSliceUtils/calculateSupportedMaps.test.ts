import { calculateSupportedMaps } from '../../../src/app/metadataSliceUtils'; // assume you export it

describe('calculateSupportedMaps', () => {
  test('returns empty if uniqueValues is empty', () => {
    expect(calculateSupportedMaps({}, ['country'])).toEqual([]);
  });

  test('returns empty if geoFields is empty', () => {
    expect(calculateSupportedMaps({ country: ['AU'] }, [])).toEqual([]);
  });

  test('returns empty if no geoFields exist in uniqueValues', () => {
    expect(calculateSupportedMaps({ city: ['SYD'] }, ['country'])).toEqual([]);
  });

  test('detects regions and top-level countries correctly', () => {
    const values = { country: ['AU-NSW', 'NZ'] };
    const result = calculateSupportedMaps(values, ['country']);
    expect(result).toEqual([['AUS_NZ', true], ['WORLD', false]]);
  });

  test('does not add WORLD if no top-level country', () => {
    const values = { country: ['AU-NSW', 'NZ-OT'] };
    const result = calculateSupportedMaps(values, ['country']);
    expect(result).toEqual([['AUS_NZ', true]]);
  });

  test('handles multiple geoFields', () => {
    const values = {
      country: ['AU', 'NZ'],
      region: ['AU-NSW', 'NZ-OT'],
      city: ['SYD'],
    };
    const result = calculateSupportedMaps(values, ['country', 'region']);
    expect(result).toEqual([['AUS_NZ', true], ['WORLD', false]]);
  });

  test('returns WORLD if no supported maps intersect', () => {
    const values = { country: ['XX', 'YY'] };
    const result = calculateSupportedMaps(values, ['country']);
    expect(result).toEqual([['WORLD', false]]);
  });

  test('works with multiple map entries intersecting', () => {
    const values = { country: ['AU', 'MY'] };
    const result = calculateSupportedMaps(values, ['country']);
    expect(result).toEqual(expect.arrayContaining([['AUS_NZ', false], ['MALAYSIA', false], ['WORLD', false]]));
  });
});
