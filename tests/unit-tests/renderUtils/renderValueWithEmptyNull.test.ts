import { renderValueOrEmptyString } from '../../../src/utilities/renderUtils';

describe('renderValueWithEmptyNull', () => {
  describe('when given null or undefined', () => {
    test('returns an empty string for null input', () => {
      expect(renderValueOrEmptyString(null)).toBe('');
    });

    test('returns an empty string for undefined input', () => {
      expect(renderValueOrEmptyString(undefined)).toBe('');
    });
  });

  describe('when given an empty string', () => {
    test('returns an empty string for an empty string input', () => {
      expect(renderValueOrEmptyString('')).toBe('');
    });
  });

  describe('when given primitive types', () => {
    test('returns the string representation of a number', () => {
      expect(renderValueOrEmptyString(123)).toBe('123');
    });

    test('returns the string representation of a boolean true', () => {
      expect(renderValueOrEmptyString(true)).toBe('true');
    });

    test('returns the string representation of a boolean false', () => {
      expect(renderValueOrEmptyString(false)).toBe('false');
    });
  });

  describe('when given objects and arrays', () => {
    test('returns the string representation of an object', () => {
      expect(renderValueOrEmptyString({ key: 'value' })).toBe('[object Object]');
    });

    test('returns the string representation of an array', () => {
      expect(renderValueOrEmptyString([1, 2, 3])).toBe('1,2,3');
    });
  });

  describe('when given a function', () => {
    test('returns the string representation of a function', () => {
      expect(renderValueOrEmptyString(() => {})).toBe('() => { }');
    });
  });
});
