import { FilterMatchMode } from 'primereact/api';
import { DataTableFilterMeta } from 'primereact/datatable';
import { encodeFilterObj } from '../../../src/utilities/urlUtils';

describe('encodeFilterObj', () => {
  describe('when given a simple filter object', () => {
    test('produces a correctly formatted string with a single key-value pair', () => {
      const filterObj: DataTableFilterMeta = {
        name: {
          value: 'John',
          matchMode: FilterMatchMode.EQUALS,
        },
      };
      const result = encodeFilterObj(filterObj);
      expect(result).toBe('(name:John:equals)');
    });
  });

  describe('when given multiple filters', () => {
    test('produces a correctly formatted string with multiple key-value pairs', () => {
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
  });

  describe('when given operator constraints', () => {
    test('correctly encodes nested constraints with an operator', () => {
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

    test('correctly encodes array values inside operator constraints', () => {
      const filterObj: DataTableFilterMeta = {
        tags: {
          operator: 'or',
          constraints: [
            { value: ['tag1', 'tag2'], matchMode: 'in' },
            { value: ['x', 'y', 'z'], matchMode: 'notIn' },
          ],
        },
      };
      const result = encodeFilterObj(filterObj);
      // Arrays are JSON-stringified and URI-encoded
      expect(result).toBe(
        '(tags:or:(%5B%22tag1%22%2C%22tag2%22%5D:in,%5B%22x%22%2C%22y%22%2C%22z%22%5D:notIn))',
      );
    });
  });

  describe('when given special characters in values', () => {
    test('properly URL-encodes special characters while maintaining filter structure', () => {
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
  });

  describe('when given edge cases', () => {
    test('omits the matchMode when it is undefined', () => {
      const filterObj: DataTableFilterMeta = {
        name: {
          value: 'John',
          matchMode: undefined,
        },
      };
      const result = encodeFilterObj(filterObj);
      expect(result).toBe('(name:John:)');
    });

    test('returns an empty parentheses string for an empty object', () => {
      const filterObj: DataTableFilterMeta = {};
      const result = encodeFilterObj(filterObj);
      expect(result).toBe('()');
    });

    test('encodes null and undefined values as strings', () => {
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

    test('encodes an empty constraints array as empty parentheses', () => {
      const filterObj: DataTableFilterMeta = {
        empty: {
          operator: 'or',
          constraints: [],
        },
      };
      const result = encodeFilterObj(filterObj);
      expect(result).toBe('(empty:or:())');
    });
  });

  describe('when given mixed types of values', () => {
    test('correctly encodes string, number, boolean, and array values', () => {
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

      // Arrays are now JSON-encoded, then URI-encoded.
      // JSON.stringify(['tag1','tag2']) → '["tag1","tag2"]'
      // encodeURIComponent → '%5B%22tag1%22%2C%22tag2%22%5D'
      expect(result).toBe(
        '(name:John:equals,age:30:gt,active:true:equals,tags:%5B%22tag1%22%2C%22tag2%22%5D:in)',
      );
    });
  });

  describe('when given date values', () => {
    test('encodes valid Date objects as ISO strings for date-related match modes', () => {
      const filterObj: DataTableFilterMeta = {
        createdAt: {
          operator: 'and',
          constraints: [
            {
              value: new Date('2024-05-01T12:00:00Z'),
              matchMode: FilterMatchMode.DATE_IS,
            },
            {
              value: new Date('2024-05-10T12:00:00Z'),
              matchMode: FilterMatchMode.DATE_BEFORE,
            },
          ],
        },
      };
      const result = encodeFilterObj(filterObj);
      expect(result).toBe(
        `(createdAt:and:(${encodeURIComponent('2024-05-01T12:00:00.000Z')}:dateIs,${encodeURIComponent('2024-05-10T12:00:00.000Z')}:dateBefore))`,
      );
    });

    test('does not ISO-encode invalid Date objects', () => {
      const filterObj: DataTableFilterMeta = {
        createdAt: {
          operator: 'or',
          constraints: [
            {
              value: new Date('invalid-date'),
              matchMode: FilterMatchMode.DATE_IS,
            },
          ],
        },
      };
      const result = encodeFilterObj(filterObj);
      expect(result).toBe('(createdAt:or:(Invalid%20Date:dateIs))');
    });

    test('encodes arrays of Date objects as JSON strings', () => {
      const filterObj: DataTableFilterMeta = {
        schedule: {
          value: [new Date('2024-01-01'), new Date('2024-02-01')],
          matchMode: 'in',
        },
      };
      const result = encodeFilterObj(filterObj);

      // JSON.stringify([...]) → ["2024-01-01T00:00:00.000Z","2024-02-01T00:00:00.000Z"]
      const encodedDates = encodeURIComponent(
        JSON.stringify(['2024-01-01T00:00:00.000Z', '2024-02-01T00:00:00.000Z']),
      );
      expect(result).toBe(`(schedule:${encodedDates}:in)`);
    });
  });
});
