import { decodeUrlToFilterObj } from '../../../src/utilities/urlUtils';

describe('decodeUrlToFilterObj', () => {
  describe('when given a simple filter object', () => {
    test('decodes the filter correctly', () => {
      const encodedStr = '(name:John:equals)';
      const result = decodeUrlToFilterObj(encodedStr);
      expect(result).toEqual({
        name: { value: 'John', matchMode: 'equals' },
      });
    });
  });

  describe('when given multiple filters', () => {
    test('decodes all filters correctly', () => {
      const encodedStr = '(name:John:equals,age:30:gt)';
      const result = decodeUrlToFilterObj(encodedStr);
      expect(result).toEqual({
        name: { value: 'John', matchMode: 'equals' },
        age: { value: '30', matchMode: 'gt' },
      });
    });
  });

  describe('when given operator constraints', () => {
    test('decodes the constraints correctly', () => {
      const encodedStr = '(name:or:(John:equals,Doe:equals))';
      const result = decodeUrlToFilterObj(encodedStr);
      expect(result).toEqual({
        name: {
          operator: 'or',
          constraints: [
            { value: 'John', matchMode: 'equals' },
            { value: 'Doe', matchMode: 'equals' },
          ],
        },
      });
    });
  });

  describe('when given special characters in values', () => {
    test('handles the special characters correctly', () => {
      const encodedStr = '(name:John%20Doe%20%26%20Co.:equals,address:' +
        '123%20Main%20St.%20Apt%20%234A:contains,notes:Check-in%3A%2010%3A00%20AM%3B%20Check-out%3A%202%3A00%20PM:custom)';

      const result = decodeUrlToFilterObj(encodedStr);

      expect(result).toEqual({
        name: { value: 'John Doe & Co.', matchMode: 'equals' },
        address: { value: '123 Main St. Apt #4A', matchMode: 'contains' },
        notes: { value: 'Check-in: 10:00 AM; Check-out: 2:00 PM', matchMode: 'custom' },
      });
    });

    test('encoded outer brackets shoudld be decodable', () => {
      const encodedStr = '%28name:John%20Doe%20%26%20Co.:equals,address:' +
        '123%20Main%20St.%20Apt%20%234A:contains,notes:Check-in%3A%2010%3A00%20AM%3B%20Check-out%3A%202%3A00%20PM:custom%29';

      const result = decodeUrlToFilterObj(encodedStr);

      expect(result).toEqual({
        name: { value: 'John Doe & Co.', matchMode: 'equals' },
        address: { value: '123 Main St. Apt #4A', matchMode: 'contains' },
        notes: { value: 'Check-in: 10:00 AM; Check-out: 2:00 PM', matchMode: 'custom' },
      });
    });

    test('encoded brackets within a filter should be parsed correctly', () => {
      const encodedStr = '%28name:or:(John:equals,%28Doe%29:equals)%29';
      const result = decodeUrlToFilterObj(encodedStr);

      expect(result).toEqual({
        name: {
          operator: 'or',
          constraints: [
            { value: 'John', matchMode: 'equals' },
            { value: '(Doe)', matchMode: 'equals' },
          ],
        },
      });
    });
  });

  describe('when given edge cases', () => {
    test('returns an empty string for undefined matchMode', () => {
      const encodedStr = '(name:John:)';
      const result = decodeUrlToFilterObj(encodedStr);
      expect(result).toEqual({
        name: { value: 'John', matchMode: '' },
      });
    });

    test('returns an empty object for empty input', () => {
      const encodedStr = '()';
      const result = decodeUrlToFilterObj(encodedStr);
      expect(result).toEqual({});
    });

    test('treats null and undefined as string values', () => {
      const encodedStr = '(name:null:equals,age:undefined:gt)';
      const result = decodeUrlToFilterObj(encodedStr);
      expect(result).toEqual({
        name: { value: 'null', matchMode: 'equals' },
        age: { value: 'undefined', matchMode: 'gt' },
      });
    });
  });
});
