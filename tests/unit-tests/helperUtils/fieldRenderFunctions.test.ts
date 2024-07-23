import { fieldRenderFunctions } from '../../../src/utilities/helperUtils';

describe('fieldRenderFunctions', () => {
  describe('Shared_groups', () => {
    test('should return empty string for null or undefined values', () => {
      expect(fieldRenderFunctions.Shared_groups(null)).toBe('');
      expect(fieldRenderFunctions.Shared_groups(undefined)).toBe('');
    });

    test('should sanitize and format the value correctly', () => {
      const input = 'value1,"value2",[value3]';
      const expectedOutput = 'value1, value2, value3';
      const result = fieldRenderFunctions.Shared_groups(input);
      expect(result).toBe(expectedOutput);
    });

    test('should handle values without unwanted characters', () => {
      const input = 'value1,value2,value3';
      const expectedOutput = 'value1, value2, value3';
      const result = fieldRenderFunctions.Shared_groups(input);
      expect(result).toBe(expectedOutput);
    });
  });

  describe('Date functions (function logic is tested elsewhere))', () => {
    test('Date_created and Date_updated are implemented', () => {
      expect(typeof fieldRenderFunctions.Date_created).toBe('function');
      expect(typeof fieldRenderFunctions.Date_updated).toBe('function');
    });
  });
});
