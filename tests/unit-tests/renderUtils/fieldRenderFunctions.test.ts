import { fieldRenderFunctions } from '../../../src/utilities/renderUtils';

describe('fieldRenderFunctions.Projects', () => {
  describe('when dealing with null or undefined', () => {
    test('return empty string', () => {
      expect(fieldRenderFunctions.Projects(null)).toBe('');
      expect(fieldRenderFunctions.Projects(undefined)).toBe('');
    });
  });

  describe('when different quotes and brackets are present', () => {
    test('remove brackets and quotes', () => {
      const input = 'value1,"value2",[value3]';
      const expectedOutput = 'value1, value2, value3';
      const result = fieldRenderFunctions.Projects(input);
      expect(result).toBe(expectedOutput);
    });
  });

  describe('when input is given with no spacing', () => {
    test('space out values for readibility', () => {
      const input = 'value1,value2,value3';
      const expectedOutput = 'value1, value2, value3';
      const result = fieldRenderFunctions.Projects(input);
      expect(result).toBe(expectedOutput);
    });
  });
  describe('Date functions (function logic is tested elsewhere))', () => {
    test('Date_created and Date_updated tests are implemented', () => {
      expect(typeof fieldRenderFunctions.Date_created).toBe('function');
      expect(typeof fieldRenderFunctions.Date_updated).toBe('function');
    });
  });
});
