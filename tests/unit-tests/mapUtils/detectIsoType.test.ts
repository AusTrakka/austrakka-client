import { detectIsoType } from '../../../src/utilities/mapUtils';

describe('detectIsoType', () => {
  test('returns null if input is null', () => {
    expect(detectIsoType(null as any)).toBeNull();
  });

  test('returns null if input is empty', () => {
    expect(detectIsoType([])).toBeNull();
  });

  test('returns iso_region for 2-letter + dash format', () => {
    const values = ['US-CA', 'US-NY'];
    expect(detectIsoType(values)).toBe('iso_region');
  });

  test('returns iso_3_char for 3-letter codes', () => {
    const values = ['USA', 'NZL'];
    expect(detectIsoType(values)).toBe('iso_3_char');
  });

  test('returns iso_2_char for 2-letter codes', () => {
    const values = ['US', 'NZ'];
    expect(detectIsoType(values)).toBe('iso_2_char');
  });

  test('skips null/undefined values and detects first valid code', () => {
    const values = [null, undefined, 'US'].filter(Boolean) as string[];
    expect(detectIsoType(values)).toBe('iso_2_char');
  });

  test('returns null if no valid ISO code found', () => {
    const values = ['123', 'ABC1', 'X'];
    expect(detectIsoType(values)).toBeNull();
  });

  test('is case-insensitive', () => {
    const values = ['us'];
    expect(detectIsoType(values)).toBe('iso_2_char');
  });
});
