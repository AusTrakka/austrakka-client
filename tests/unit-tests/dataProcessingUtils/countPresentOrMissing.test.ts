import { countPresentOrMissing } from '../../../src/utilities/dataProcessingUtils';

// TODO check if we've broken e.g. PHESS widget

describe('countPresentOrMissing', () => {
  test('given an empty input array, returns zero counts', () => {
    const input: any[] = [];
    const property = 'someProperty';
    const result = countPresentOrMissing(property, input);
    expect(result).toEqual([
      { status: 'Available', sampleCount: 0 },
      { status: 'Missing', sampleCount: 0 },
    ]);
  });
  
  test('given an array with all relevant values populated, returns correct counts', () => {
    const input = [
      { someProperty: 'value1', anotherProperty: 'value1' },
      { someProperty: 'value2', anotherProperty: 'value2' },
      { someProperty: 'value3', anotherProperty: null },
    ];
    const property = 'someProperty';
    const result = countPresentOrMissing(property, input);
    expect(result).toEqual([
      { status: 'Available', sampleCount: 3 },
      { status: 'Missing', sampleCount: 0 },
    ]);
  });
  
  test('given an array with some relevant values empty, returns correct counts', () => {
    const input = [
      { someProperty: 'value1', anotherProperty: 'value1' },
      { someProperty: '', anotherProperty: '' },
      { someProperty: 'value3', anotherProperty: null },
    ];
    const property = 'someProperty';
    const result = countPresentOrMissing(property, input);
    expect(result).toEqual([
      { status: 'Available', sampleCount: 2 },
      { status: 'Missing', sampleCount: 1 },
    ]);
  });
  
  test('given an array with some relevant values null, returns correct counts', () => {
    const input = [
      { someProperty: 'value1', anotherProperty: 'value1' },
      { someProperty: null, anotherProperty: null },
      { someProperty: 'value3', anotherProperty: null },
    ];
    const property = 'someProperty';
    const result = countPresentOrMissing(property, input);
    expect(result).toEqual([
      { status: 'Available', sampleCount: 2 },
      { status: 'Missing', sampleCount: 1 },
    ]);
  });
});
