import { testOnlyExports } from '../../../src/utilities/helperUtils';

const { decodeUrlToFilterObj } = testOnlyExports;

// decoding will not regain type information of values in the url
// this seems to not be an issue as the table that uses the filter
// can correcly deduce the type even when all values supplied are strings
// even for numbers, dates. etc...
describe('decodeUrlToFilterObj', () => {
  test('should decode a simple filter object', () => {
    const encodedStr = '(name:John:equals)';
    const result = decodeUrlToFilterObj(encodedStr);
    expect(result).toEqual({
      name: { value: 'John', matchMode: 'equals' },
    });
  });

  test('should decode a filter object with multiple filters', () => {
    const encodedStr = '(name:John:equals,age:30:gt)';
    const result = decodeUrlToFilterObj(encodedStr);
    expect(result).toEqual({
      name: { value: 'John', matchMode: 'equals' },
      age: { value: '30', matchMode: 'gt' },
    });
  });

  test('should decode a filter object with operator constraints', () => {
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

  test('should handle special characters in values', () => {
    const encodedStr = '(name:John%20Doe%20%26%20Co.:equals,address:' +
      '123%20Main%20St.%20Apt%20%234A:contains,notes:Check-in%3A%2010%3A00%20AM%3B%20Check-out%3A%202%3A00%20PM:custom)';
    const result = decodeUrlToFilterObj(encodedStr);
    expect(result).toEqual({
      name: { value: 'John Doe & Co.', matchMode: 'equals' },
      address: { value: '123 Main St. Apt #4A', matchMode: 'contains' },
      notes: { value: 'Check-in: 10:00 AM; Check-out: 2:00 PM', matchMode: 'custom' },
    });
  });

  test('should handle undefined matchMode', () => {
    const encodedStr = '(name:John:)';
    const result = decodeUrlToFilterObj(encodedStr);
    expect(result).toEqual({
      name: { value: 'John', matchMode: '' },
    });
  });

  test('should handle an empty object', () => {
    const encodedStr = '()';
    const result = decodeUrlToFilterObj(encodedStr);
    expect(result).toEqual({});
  });

  // test should be assumed if strings such as 'undefined' and
  // 'null' exist in the url than test is an actaul string value and not a
  // representation of the actual types
  test('should handle null and undefined values', () => {
    const encodedStr = '(name:null:equals,age:undefined:gt)';
    const result = decodeUrlToFilterObj(encodedStr);
    expect(result).toEqual({
      name: { value: 'null', matchMode: 'equals' },
      age: { value: 'undefined', matchMode: 'gt' },
    });
  });
});
