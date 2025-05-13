import { compareProperties } from '../../../src/utilities/dataProcessingUtils';

describe('compareProperties', () => {
  describe('test sorts correctly by a single string property', () => {
    const list = [{ name: 'Bob' }, { name: 'Alice' }, { name: null }, { name: 'Charlie' }];
    
    // nulls should be placed last regardless of ascending/descending
    test('in ascending order', () => {
      const sortedList = [...list];
      sortedList.sort((a, b) =>
        compareProperties(a, b, [[(x) => x.name, 1]]));

      expect(sortedList).toEqual([
        { name: 'Alice' },
        { name: 'Bob' },
        { name: 'Charlie' },
        { name: null },
      ]);
    });
    
    test('in descending order', () => {
      const sortedList = [...list];
      sortedList.sort((a, b) =>
        compareProperties(a, b, [[(x) => x.name, -1]]));

      expect(sortedList).toEqual([
        { name: 'Charlie' },
        { name: 'Bob' },
        { name: 'Alice' },
        { name: null },
      ]);
    });
  });
  
  describe('test sorts correctly by a single numeric property, in numeric not alphabetical order', () => {
    const list = [{ age: 30 }, { age: 8 }, { age: null }, { age: 35 }];
    
    test('in ascending order', () => {
      const sortedList = [...list];
      sortedList.sort((a, b) =>
        compareProperties(a, b, [[(x) => x.age, 1]]));

      expect(sortedList).toEqual([
        { age: 8 },
        { age: 30 },
        { age: 35 },
        { age: null },
      ]);
    });
    
    test('in descending order', () => {
      const sortedList = [...list];
      sortedList.sort((a, b) =>
        compareProperties(a, b, [[(x) => x.age, -1]]));

      expect(sortedList).toEqual([
        { age: 35 },
        { age: 30 },
        { age: 8 },
        { age: null },
      ]);
    });
  });
  
  describe('test sorts correctly by multiple properties', () => {
    const list = [
      { name: 'Bob', age: 30 },
      { name: 'Alice', age: 35 },
      { name: 'Charlie', age: 30 },
      { name: null, age: 30 },
      { name: 'Charlie', age: null },
    ];
    
    test('in ascending order', () => {
      const sortedList = [...list];
      sortedList.sort((a, b) =>
        compareProperties(a, b, [[(x) => x.age, 1], [(x) => x.name, 1]]));

      expect(sortedList).toEqual([
        { name: 'Bob', age: 30 },
        { name: 'Charlie', age: 30 },
        { name: null, age: 30 },
        { name: 'Alice', age: 35 },
        { name: 'Charlie', age: null },
      ]);
    });
    
    test('in descending order', () => {
      const sortedList = [...list];
      sortedList.sort((a, b) =>
        compareProperties(a, b, [[(x) => x.age, -1], [(x) => x.name, -1]]));

      expect(sortedList).toEqual([
        { name: 'Alice', age: 35 },
        { name: 'Charlie', age: 30 },
        { name: 'Bob', age: 30 },
        { name: null, age: 30 },
        { name: 'Charlie', age: null },
      ]);
    });
    
    test('in mixed orders', () => {
      const sortedList = [...list];
      sortedList.sort((a, b) =>
        compareProperties(a, b, [[(x) => x.age, 1], [(x) => x.name, -1]]));

      expect(sortedList).toEqual([
        { name: 'Charlie', age: 30 },
        { name: 'Bob', age: 30 },
        { name: null, age: 30 },
        { name: 'Alice', age: 35 },
        { name: 'Charlie', age: null },
      ]);
    });
  });
});
