import { describe } from '@jest/globals';
import { formatCSVValues } from '../../../src/utilities/exportUtils';

describe('formatCSVValues', () => {
  const dateString = '2023-01-01T00:00:00.000Z';
  
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(dateString));
  });

  afterAll(() => {
    jest.useRealTimers();
  });
  describe('inputting a key that is expected for fieldRenderValue', () => {
    // not testing the inner working too much as there are tests for that elsewhere
    test('Date_created should return a formatted date yyyy-mm-dd hh:mm', () => {
      const inputValue = {
        Date_created: dateString,
      };
      const expectedOutput = {
        'Date_created': '2023-01-01 10:00',
      };
      const actualOutput = formatCSVValues(inputValue);
      expect(actualOutput).toStrictEqual(expectedOutput);
    });
    
    test('Date_updated should return a formatted date yyyy-mm-dd hh:mm', () => {
      const inputValue = {
        Date_updated: '2023-01-01T00:00:00.000Z',
      };
      const expectedOutput = {
        'Date_updated': '2023-01-01 10:00',
      };
      const actualOutput = formatCSVValues(inputValue);
      expect(actualOutput).toStrictEqual(expectedOutput);
    });
    
    test('Shared_groups should return a comma separated list of values', () => {
      const inputValue = {
        Shared_groups: '["value1","value2","value3"]',
      };
      const expectedOutput = {
        'Shared_groups': 'value1, value2, value3',
      };
      const actualOutput = formatCSVValues(inputValue);
      expect(actualOutput).toStrictEqual(expectedOutput);
    });
  });
  
  describe('inputting a key that is expected for typeRenderValue', () => {
    test('value is of date type should return in format of yyyy-mm-dd', () => {
      const inputValue = {
        Date_coll: new Date(dateString),
      };
      const expectedOutput = {
        'Date_coll': '2023-01-01',
      };
      const actualOutput = formatCSVValues(inputValue);
      expect(actualOutput).toStrictEqual(expectedOutput);
    });
    test('value is of type boolean should return as a string', () => {
      const inputValue = {
        Has_sequences: true,
      };
      const expectedOutput = {
        'Has_sequences': 'true',
      };
      const actualOutput = formatCSVValues(inputValue);
      expect(actualOutput).toStrictEqual(expectedOutput);
    });
    test('value is of type object null should return as empty string', () => {
      const inputValue = {
        Has_sequences: null,
      };
      const expectedOutput = {
        'Has_sequences': '',
      };
      const actualOutput = formatCSVValues(inputValue);
      expect(actualOutput).toStrictEqual(expectedOutput);
    });
  });
  
  describe('when key does not exist in fieldRenderValue and ' +
      'type does not exist in typeRenderValue and value is string', () => {
    test('should return the value as a string', () => {
      const inputValue = {
        key: 'value',
      };
      const expectedOutput = {
        'key': 'value',
      };
      const actualOutput = formatCSVValues(inputValue);
      expect(actualOutput).toStrictEqual(expectedOutput);
    });
    test('should return the value as a string with double quotes', () => {
      const inputValue = {
        key: '"value"',
      };
      const expectedOutput = {
        'key': '""value""',
      };
      const actualOutput = formatCSVValues(inputValue);
      expect(actualOutput).toStrictEqual(expectedOutput);
    });
  });
});
