import { getCountryCode } from '../../../src/app/metadataSliceUtils';

describe('standardise', () => {
  test('returns null for null or empty input', () => {
    expect(getCountryCode(null as any)).toBeNull();
    expect(getCountryCode('')).toBeNull();
    expect(getCountryCode('   ')).toBeNull();
  });

  test('trims and uppercases input', () => {
    expect(getCountryCode(' au ')).toBe('AU');
    expect(getCountryCode('nzl')).toBe('NZL');
  });

  test('returns first two letters for subdivision codes', () => {
    expect(getCountryCode('AU-NSW')).toBe('AU');
    expect(getCountryCode('us-CA')).toBe('US');
  });

  test('returns ISO2 codes as uppercase', () => {
    expect(getCountryCode('AU')).toBe('AU');
    expect(getCountryCode('us')).toBe('US');
  });

  test('returns ISO3 codes as uppercase', () => {
    expect(getCountryCode('USA')).toBe('USA');
    expect(getCountryCode('nzl')).toBe('NZL');
  });

  test('returns null for unsupported codes', () => {
    expect(getCountryCode('123')).toBeNull();
    expect(getCountryCode('A')).toBeNull();
    expect(getCountryCode('US1')).toBeNull();
    expect(getCountryCode('AU-N')).toBe('AU'); // still a subdivision, slice works
  });
});
