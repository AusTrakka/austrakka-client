import { FilterMatchMode } from 'primereact/api';
import { getConditionName } from '../../../src/utilities/filterUtils';

describe('getConditionName', () => {
  const conditions = [
    { value: FilterMatchMode.EQUALS, name: 'Equals' },
    { value: FilterMatchMode.CONTAINS, name: 'Contains' },
    { value: FilterMatchMode.STARTS_WITH, name: 'Starts With' },
  ];

  describe('when the constraint matchMode is found in conditions', () => {
    test('returns the correct name', () => {
      const constraint = { matchMode: FilterMatchMode.CONTAINS, value: 'abc' };
      const result = getConditionName(constraint, conditions);
      expect(result).toBe('Contains');
    });

    test('handles other standard match modes', () => {
      const constraint = { matchMode: FilterMatchMode.STARTS_WITH, value: 'A' };
      const result = getConditionName(constraint, conditions);
      expect(result).toBe('Starts With');
    });
  });

  describe('when the matchMode is not in the conditions list', () => {
    test('returns "Unknown" for an unrecognized matchMode', () => {
      const constraint = { matchMode: FilterMatchMode.NOT_EQUALS, value: '123' };
      const condition = [{ value: 'equals', name: 'Equals' }]; // deliberately missing 'notEquals'
      const result = getConditionName(constraint, condition);
      expect(result).toBe('Unknown');
    });
  });

  describe('when the matchMode is CUSTOM', () => {
    test('returns "Null or Empty" when value is true (boolean)', () => {
      const constraint = { matchMode: FilterMatchMode.CUSTOM, value: true };
      const result = getConditionName(constraint, conditions);
      expect(result).toBe('Null or Empty');
    });

    test('returns "Null or Empty" when value is "true" (string)', () => {
      const constraint = { matchMode: FilterMatchMode.CUSTOM, value: 'true' };
      const result = getConditionName(constraint, conditions);
      expect(result).toBe('Null or Empty');
    });

    test('returns "Not Null or Empty" when value is false (boolean)', () => {
      const constraint = { matchMode: FilterMatchMode.CUSTOM, value: false };
      const result = getConditionName(constraint, conditions);
      expect(result).toBe('Not Null or Empty');
    });

    test('returns "Not Null or Empty" when value is "false" (string)', () => {
      const constraint = { matchMode: FilterMatchMode.CUSTOM, value: 'false' };
      const result = getConditionName(constraint, conditions);
      expect(result).toBe('Not Null or Empty');
    });

    test('returns "Unknown" when CUSTOM has unrelated value', () => {
      const constraint = { matchMode: FilterMatchMode.CUSTOM, value: 'random' };
      const result = getConditionName(constraint, conditions);
      expect(result).toBe('Unknown');
    });
  });

  describe('edge cases', () => {
    test('returns "Unknown" when constraint.matchMode is undefined', () => {
      const constraint = { matchMode: undefined, value: 'abc' };
      const result = getConditionName(constraint as any, conditions);
      expect(result).toBe('Unknown');
    });

    test('returns "Unknown" when constraint.value is undefined and mode not found', () => {
      const constraint = { matchMode: 'something', value: undefined };
      const result = getConditionName(constraint as any, conditions);
      expect(result).toBe('Unknown');
    });

    test('returns "Unknown" when conditions list is empty', () => {
      const constraint = { matchMode: FilterMatchMode.EQUALS, value: 'abc' };
      const result = getConditionName(constraint, []);
      expect(result).toBe('Unknown');
    });
  });
});
