import { standardise } from '../../../src/app/metadataSliceUtils';

describe('standardise', () => {
  test('returns null for null or empty input', () => {
    expect(standardise(null as any)).toBeNull();
    expect(standardise('')).toBeNull();
    expect(standardise('   ')).toBeNull();
  });

  test('trims and uppercases input', () => {
    expect(standardise(' au ')).toBe('AU');
    expect(standardise('nzl')).toBe('NZL');
  });

  test('returns first two letters for subdivision codes', () => {
    expect(standardise('AU-NSW')).toBe('AU');
    expect(standardise('us-CA')).toBe('US');
  });

  test('returns ISO2 codes as uppercase', () => {
    expect(standardise('AU')).toBe('AU');
    expect(standardise('us')).toBe('US');
  });

  test('returns ISO3 codes as uppercase', () => {
    expect(standardise('USA')).toBe('USA');
    expect(standardise('nzl')).toBe('NZL');
  });

  test('returns null for unsupported codes', () => {
    expect(standardise('123')).toBeNull();
    expect(standardise('A')).toBeNull();
    expect(standardise('US1')).toBeNull();
    expect(standardise('AU-N')).toBe('AU'); // still a subdivision, slice works
  });
});
