import { FilterMatchMode } from 'primereact/api';
import { DataTableFilterMeta } from 'primereact/datatable';
import { testOnlyExports } from '../../../src/utilities/helperUtils';

const { encodeFilterObj } = testOnlyExports;

describe('encodeFilterObj', () => {
  test('should be able to encode a simple filter object', () => {
    const filterObj: DataTableFilterMeta = {
      name: {
        value: 'John',
        matchMode: FilterMatchMode.EQUALS,
      },
    };

    const result = encodeFilterObj(filterObj);
    expect(result).toBe('(name:John:equals)');
  });

  test('should be able to encode filter obj wtesth multiple filters', () => {
    const filterObj: DataTableFilterMeta = {
      name: {
        value: 'John',
        matchMode: FilterMatchMode.EQUALS,
      },
      age: {
        value: 30,
        matchMode: FilterMatchMode.GREATER_THAN,
      },
    };

    const result = encodeFilterObj(filterObj);
    expect(result).toBe('(name:John:equals,age:30:gt)');
  });

  test('should be able to encode a filter object wtesth the operator constraints', () => {
    const filterObj: DataTableFilterMeta = {
      name: {
        operator: 'and',
        constraints: [
          { value: 'John', matchMode: FilterMatchMode.EQUALS },
          { value: 'Mc', matchMode: FilterMatchMode.CONTAINS },
        ],
      },
    };

    const result = encodeFilterObj(filterObj);
    expect(result).toBe('(name:and:(John:equals,Mc:contains))');
  });
  test('should handle special characters in values', () => {
    const filterObj: DataTableFilterMeta = {
      name: {
        value: 'John Doe & Co.',
        matchMode: FilterMatchMode.EQUALS,
      },
      address: {
        value: '123 Main St. Apt #4A',
        matchMode: 'contains',
      },
      notes: {
        value: 'Check-in: 10:00 AM; Check-out: 2:00 PM',
        matchMode: 'custom',
      },
    };

    const result = encodeFilterObj(filterObj);
    expect(result).toBe(
      '(name:John%20Doe%20%26%20Co.:equals,address:123%20Main%20St.%20Apt%20%234A:contains,'
      + 'notes:Check-in%3A%2010%3A00%20AM%3B%20Check-out%3A%202%3A00%20PM:custom)',
    );
  });

  test('should handle undefined matchMode', () => {
    const filterObj: DataTableFilterMeta = {
      name: {
        value: 'John',
        matchMode: undefined,
      },
    };

    const result = encodeFilterObj(filterObj);
    expect(result).toBe('(name:John:)');
  });

  test('should handle an empty object', () => {
    const filterObj: DataTableFilterMeta = {};

    const result = encodeFilterObj(filterObj);
    expect(result).toBe('()');
  });

  test('should handle an empty object', () => {
    const filterObj: DataTableFilterMeta = {};

    const result = encodeFilterObj(filterObj);
    expect(result).toBe('()');
  });

  test('should handle null and undefined values', () => {
    const filterObj: DataTableFilterMeta = {
      name: {
        value: null,
        matchMode: 'equals',
      },
      age: {
        value: undefined,
        matchMode: 'gt',
      },
    };

    const result = encodeFilterObj(filterObj);
    expect(result).toBe('(name:null:equals,age:undefined:gt)');
  });

  test('should handle empty constraints array', () => {
    const filterObj: DataTableFilterMeta = {
      empty: {
        operator: 'or',
        constraints: [],
      },
    };

    const result = encodeFilterObj(filterObj);
    expect(result).toBe('(empty:or:())');
  });

  test('should handle mixed types of values', () => {
    const filterObj: DataTableFilterMeta = {
      name: {
        value: 'John',
        matchMode: 'equals',
      },
      age: {
        value: 30,
        matchMode: 'gt',
      },
      active: {
        value: true,
        matchMode: 'equals',
      },
      tags: {
        value: ['tag1', 'tag2'],
        matchMode: 'in',
      },
    };

    const result = encodeFilterObj(filterObj);
    expect(result).toBe('(name:John:equals,age:30:gt,active:true:equals,tags:tag1%2Ctag2:in)');
  });
});
