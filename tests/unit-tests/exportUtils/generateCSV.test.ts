import { generateCSV } from '../../../src/utilities/exportUtils';

describe('generateCSV', () => {
  describe('given data to export and no specific selection criteria', () => {
    test('expect correct number of rows', () => {
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
      const expectedOutput = 'key1,key2\n' +
                '"value1","value2"\n' +
                '"value3","value4"';
      const actualOutput = generateCSV(data);
      expect(actualOutput).toEqual(expectedOutput);
    });
    test('expect correct number of columns', () => {
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
      const expectedOutput = 'key1,key2\n' +
                '"value1","value2"\n' +
                '"value3","value4"';
      const actualOutput = generateCSV(data);
      expect(actualOutput).toEqual(expectedOutput);
    });
  });

  describe('expect date values to be in yyyy-mm-dd format', () => {
    test('given data to export contains date objects', () => {
      const data = [
        {
          key1: 'value1',
          key2: new Date('2022-01-01'),
        },
        {
          key1: 'value3',
          key2: new Date('2022-01-02'),
        },
      ];
      const expectedOutput = 'key1,key2\n' +
                '"value1","2022-01-01"\n' +
                '"value3","2022-01-02"';
      const actualOutput = generateCSV(data);
      expect(actualOutput).toEqual(expectedOutput);
    });
    test('given data to export contains date strings', () => {
      const data = [
        {
          key1: 'value1',
          key2: '2022-01-01',
        },
        {
          key1: 'value3',
          key2: '2022-01-02',
        },
      ];
      const expectedOutput = 'key1,key2\n' +
                '"value1","2022-01-01"\n' +
                '"value3","2022-01-02"';
      const actualOutput = generateCSV(data);
      expect(actualOutput).toEqual(expectedOutput);
    });
  });
  describe('expect string values to be double-quoted in output', () => {
    test('given data to export contains strings', () => {
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
      const expectedOutput = 'key1,key2\n' +
                '"value1","value2"\n' +
                '"value3","value4"';
      const actualOutput = generateCSV(data);
      expect(actualOutput).toEqual(expectedOutput);
    });

    test('given data contains quotes expect quotes to be escaped and the value to be quoted', () => {
      const data = [
        {
          key1: '"value1"',
          key2: '"value2"',
        },
        {
          key1: '"value3"',
          key2: '"value4"',
        },
      ];
      const expectedOutput = 'key1,key2\n' +
                '"""value1""","""value2"""\n' +
                '"""value3""","""value4"""';
      const actualOutput = generateCSV(data);
      expect(actualOutput).toEqual(expectedOutput);
    });

    test('random quote should be escaped', () => {
      const data = [
        {
          key1: '"value1',
          key2: 'value2',
        },
        {
          key1: 'value3"',
          key2: 'v"alue4',
        },
      ];
      const expectedOutput = 'key1,key2\n' +
                '"""value1","value2"\n' +
                '"value3""","v""alue4"';
      const actualOutput = generateCSV(data);
      expect(actualOutput).toEqual(expectedOutput);
    });
  });
  describe('data to export is passed with specific subset of headers', () => {
    test('expect only specified columns in output', () => {
      const data = [
        {
          key1: 'value1',
          key2: 'value2',
          key3: 'value3',
        },
        {
          key1: 'value3',
          key2: 'value4',
          key3: 'value5',
        },
      ];
      const expectedOutput = 'key1,key2\n' +
                '"value1","value2"\n' +
                '"value3","value4"';
      const actualOutput = generateCSV(data, ['key1', 'key2']);
      expect(actualOutput).toEqual(expectedOutput);
    });
  });

  describe('data to export is passed with specific column order', () => {
    test('expect output to sort columns as requested', () => {
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
      const expectedOutput = 'key2,key1\n' +
                '"value2","value1"\n' +
                '"value4","value3"';
      const actualOutput = generateCSV(data, ['key2', 'key1']);
      expect(actualOutput).toEqual(expectedOutput);
    });
  });

  describe('when data contains special characters', () => {
    test('expect method to not be affected by special characters', () => {
      const data = [
        {
          key1: '!DDS-*&^%$#@!',
          key2: 'dsi29-}*&^%$#@!',
        },
        {
          key1: '\'DDS-*&^%$#@![}[]po-=><<>',
          // all special characters next
          // eslint-disable-next-line no-useless-escape
          key2: '\"\\`{}[]()<>.,;:|/?=!+-*/&@%#&&||==!=<=>= \t\n\r\0~^',
        },
      ];

      const expectedOutput = 'key1,key2\n' +
          '"!DDS-*&^%$#@!","dsi29-}*&^%$#@!"\n' +
          '"\'DDS-*&^%$#@![}[]po-=><<>","""\\`{}[]()<>.,;:|/?=!+-*/&@%#&&||==!=<=>= \t\n\r\0~^"';

      const actualOutput = generateCSV(data);

      expect(actualOutput).toEqual(expectedOutput);
    });
  });

  describe('when a large piece of data is given', () => {
    test('expect output to be fully correct', () => {
      // Generate a large dataset with random special characters and strings
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        key1: `value${i}-*&^%$#@!`,
        key2: `anotherValue${i}-{}[]()<>!+-*/@#`,
      }));

      // Expected output - CSV headers and rows. Each value should be wrapped in quotes.
      const expectedOutput = `key1,key2\n${
        largeData.map(row => `"${row.key1}","${row.key2}"`).join('\n')}`;

      // Call the function under test
      const actualOutput = generateCSV(largeData);

      // Compare the actual output with the expected output
      expect(actualOutput).toEqual(expectedOutput);
    });
  });

  describe('when a large piece of data with many columns is given', () => {
    test('expect output to be fully correct', () => {
      // Generate large data with many columns and long column names
      const numColumns = 1000; // Large number of columns
      const numRows = 10; // Moderate number of rows for simplicity
      const columnNames = Array.from({ length: numColumns }, (_, i) => `column_${i}_with_a_very_long_name`);

      // Generate rows where each value has special characters
      const largeData = Array.from({ length: numRows }, () => {
        const row = {} as any;
        columnNames.forEach((name, i) => {
          row[name] = `value_${i}_*&^%$#@!`;
        });
        return row;
      });

      // Expected output - Start with the CSV header
      let expectedOutput = `${columnNames.join(',')}\n`;

      // Add each row with values wrapped in quotes
      expectedOutput += largeData.map(row =>
        columnNames.map(col => `"${row[col]}"`).join(',')).join('\n');

      // Call the function under test
      const actualOutput = generateCSV(largeData);

      // Compare the actual output with the expected output
      expect(actualOutput).toEqual(expectedOutput);
    });
  });
});
