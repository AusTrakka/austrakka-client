import { formatDataAsCSV } from '../../../src/utilities/exportUtils';

describe('formatDataAsCSV', () => {
  test('should return a string with headers and data rows', () => {
    const data = [
      {
        key1: 'value1',
        key2: 'value2',
      },
      {
        key1: 'value3',
        key2: 'value4',
      },
    ];
    const headerString = ['key1', 'key2'];
    const expectedOutput = 'key1,key2\n' +
        '"value1","value2"\n' +
        '"value3","value4"';
    const actualOutput = formatDataAsCSV(data, headerString);
    expect(actualOutput).toEqual(expectedOutput);
  });
  
  // header values have a dot in them
  test('should handle header values with dots', () => {
    const data = [
      {
        'key1.key2': 'value1',
        'key3.key4': 'value2',
      },
      {
        'key1.key2': 'value3',
        'key3.key4': 'value4',
      },
    ];
    const headerString = ['key1.key2', 'key3.key4'];
    const expectedOutput = 'key1.key2,key3.key4\n' +
          '"value1","value2"\n' +
          '"value3","value4"';
    const actualOutput = formatDataAsCSV(data, headerString);
    expect(actualOutput).toEqual(expectedOutput);
  });
  
  // header values have special characters and different alphanumeric combinations
  test('should handle header values with special characters and different alphanumeric combinations', () => {
    const data = [
      {
        'key1!@#$%^-&*()_+{}:"|/?><,.;': 'value1',
        'key2!@#$%^-&*()_+{}:"|/?><,.;': 'value2',
      },
      {
        'key1!@#$%^-&*()_+{}:"|/?><,.;': 'value3',
        'key2!@#$%^-&*()_+{}:"|/?><,.;': 'value4',
      },
    ];
    const headerString = ['key1!@#$%^-&*()_+{}:"|/?><,.;', 'key2!@#$%^&*()_+{}:"|/?><,.;'];
    const expectedOutput = 'key1!@#$%^-&*()_+{}:"|/?><,.;,key2!@#$%^&*()_+{}:"|/?><,.;\n' +
          '"value1","value2"\n' +
          '"value3","value4"';
    const actualOutput = formatDataAsCSV(data, headerString);
    expect(actualOutput).toEqual(expectedOutput);
  });
  
  test('should handle header values with commas', () => {
    const data = [
      {
        'key1,key2': 'value1',
        'key3,key4': 'value2',
      },
      {
        'key1,key2': 'value3',
        'key3,key4': 'value4',
      },
    ];
    const headerString = ['key1,key2', 'key3,key4'];
    const expectedOutput = 'key1,key2,key3,key4\n' +
          '"value1","value2"\n' +
          '"value3","value4"';
    const actualOutput = formatDataAsCSV(data, headerString);
    expect(actualOutput).toEqual(expectedOutput);
  });
});
