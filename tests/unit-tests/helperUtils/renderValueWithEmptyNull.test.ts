import { renderValueWithEmptyNull } from '../../../src/utilities/helperUtils';

describe('renderValueWithEmptyNull', () => {
  test('should return an empty string for null input', () => {
    expect(renderValueWithEmptyNull(null)).toBe('');
  });

  test('should return an empty string for undefined input', () => {
    expect(renderValueWithEmptyNull(undefined)).toBe('');
  });

  test('should return an empty string for an empty string input', () => {
    expect(renderValueWithEmptyNull('')).toBe('');
  });

  test('should return the string representation of a number', () => {
    expect(renderValueWithEmptyNull(123)).toBe('123');
  });

  test('should return the string representation of a boolean true', () => {
    expect(renderValueWithEmptyNull(true)).toBe('true');
  });

  test('should return the string representation of a boolean false', () => {
    expect(renderValueWithEmptyNull(false)).toBe('false');
  });

  test('should return the string representation of an object', () => {
    expect(renderValueWithEmptyNull({ key: 'value' })).toBe('[object Object]');
  });

  test('should return the string representation of an array', () => {
    expect(renderValueWithEmptyNull([1, 2, 3])).toBe('1,2,3');
  });

  test('should return the string representation of a function', () => {
    expect(renderValueWithEmptyNull(() => { })).toBe('() => { }');
  });
});
