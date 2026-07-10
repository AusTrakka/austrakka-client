import { compareDatesDesc } from '../../../src/app/metadataSliceUtils';

describe('compareDatesDesc', () => {
  test('given both dates are null, should return 0', () => {
    const aDate: Date | null = null;
    const bDate: Date | null = null;

    const result = compareDatesDesc(aDate, bDate);

    expect(result).toEqual(0);
  });

  test('given only the first date is null, should return 1', () => {
    const aDate: Date | null = null;
    const bDate: Date | null = new Date('2026-01-01');

    const result = compareDatesDesc(aDate, bDate);

    expect(result).toEqual(1);
  });

  test('given only the second date is null, should return -1', () => {
    const aDate: Date | null = new Date('2026-01-01');
    const bDate: Date | null = null;

    const result = compareDatesDesc(aDate, bDate);

    expect(result).toEqual(-1);
  });

  test('given the second date is more recent than the first date, should return a positive number', () => {
    const aDate: Date | null = new Date('2026-01-01');
    const bDate: Date | null = new Date('2026-06-01');

    const result = compareDatesDesc(aDate, bDate);

    // Using toBeGreaterThan(0) since getTime differences return the actual ms delta
    expect(result).toBeGreaterThan(0);
  });

  test('given the first date is more recent than the second date, should return a negative number', () => {
    const aDate: Date | null = new Date('2026-06-01');
    const bDate: Date | null = new Date('2026-01-01');

    const result = compareDatesDesc(aDate, bDate);

    expect(result).toBeLessThan(0);
  });

  test('given both dates are identical, should return 0', () => {
    const aDate: Date | null = new Date('2026-03-15T12:00:00Z');
    const bDate: Date | null = new Date('2026-03-15T12:00:00Z');

    const result = compareDatesDesc(aDate, bDate);

    expect(result).toEqual(0);
  });
});
