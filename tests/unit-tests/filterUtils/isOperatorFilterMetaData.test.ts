import { DataTableFilterMetaData, DataTableOperatorFilterMetaData } from 'primereact/datatable';
import { isOperatorFilterMetaData } from '../../../src/utilities/filterUtils';

describe('isOperatorFilterMetaData', () => {
  test('returns true for a valid DataTableOperatorFilterMetaData object', () => {
    const operatorFilterData: DataTableOperatorFilterMetaData = {
      operator: 'and',
      constraints: [
        { value: 'test', matchMode: 'equals' },
      ],
    };
    expect(isOperatorFilterMetaData(operatorFilterData)).toBe(true);
  });

  test('returns false for a DataTableFilterMetaData object', () => {
    const filterData: DataTableFilterMetaData = {
      value: 'test',
      matchMode: 'equals',
    };
    expect(isOperatorFilterMetaData(filterData)).toBe(false);
  });

  test('returns false for an object with only operator property', () => {
    const partialData = {
      operator: 'and',
    };
    expect(isOperatorFilterMetaData(partialData as any)).toBe(false);
  });

  test('returns false for an object with only constraints property', () => {
    const partialData = {
      constraints: [],
    };
    expect(isOperatorFilterMetaData(partialData as any)).toBe(false);
  });

  test('returns false for an empty object', () => {
    expect(isOperatorFilterMetaData({} as any)).toBe(false);
  });

  test('returns false for null', () => {
    expect(isOperatorFilterMetaData(null as any)).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(isOperatorFilterMetaData(undefined as any)).toBe(false);
  });
});
