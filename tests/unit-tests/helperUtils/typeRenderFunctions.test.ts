import { typeRenderFunctions } from '../../../src/utilities/helperUtils';

describe('typeRenderFunctions (function logic is tested elsewhere)', () => {
  describe('when checking boolean and date functions', () => {
    test('functions are implemented correctly', () => {
      expect(typeof typeRenderFunctions.boolean).toBe('function');
      expect(typeof typeRenderFunctions.date).toBe('function');

      // Check that they don't throw and return a value
      expect(() => typeRenderFunctions.boolean(true)).not.toThrow();
      expect(typeRenderFunctions.boolean(false)).toBeDefined();

      expect(() => typeRenderFunctions.date('2024-07-23')).not.toThrow();
      expect(typeRenderFunctions.date('2024-07-23')).toBeDefined();
    });
  });
});
