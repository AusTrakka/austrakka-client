import { Sample } from '../types/sample.interface';
import { HAS_SEQUENCES } from '../constants/metadataConsts';

// Function to aggregate counts of objects in an array, on a certain property

export function aggregateArrayObjects(property: string, array: Array<any>) {
  if (!array || !Array.isArray(array)) {
    return [];
  }

  const aggregatedCounts = [];
  const map = new Map();

  for (let i = 0; i < array.length; i += 1) {
    const item = array[i];

    if (item && typeof item === 'object' && property in item) {
      const value = item[property];
      if (map.has(value)) {
        map.set(value, map.get(value) + 1);
      } else {
        map.set(value, 1);
      }
    }
  }

  for (const [key, value] of map) {
    const obj = { [property]: key, sampleCount: value }; // TODO rename to generic
    aggregatedCounts.push(obj);
  }

  return aggregatedCounts;
}

export function countPresentOrMissing(property: string, array: Array<any>) {
  if (!array || !Array.isArray(array)) {
    return [
      { status: 'Present', sampleCount: 0 },
      { status: 'Missing', sampleCount: 0 },
    ];
  }
  
  let presentCount = 0;
  array.forEach((item) => {
    if (item && typeof item === 'object' && property in item) {
      const value = item[property];
      // Note that false counts as present
      if (value !== '' && value !== null && value !== undefined) {
        presentCount += 1;
      }
    }
  });
  
  return [
    { status: 'Present', sampleCount: presentCount },
    { status: 'Missing', sampleCount: array.length - presentCount },
  ];
}

export function replaceHasSequencesNullsWithFalse(data: Sample[]): Sample[] {
  data.forEach((sample) => {
    if (sample[HAS_SEQUENCES] === null || sample[HAS_SEQUENCES] === '') {
      sample[HAS_SEQUENCES] = false;
    }
  });

  return data;
}

export function replaceNullsWithEmpty(data: Sample[]): void {
  const replaceNullsInObject = (obj: Sample): void => {
    Object.keys(obj).forEach((key) => {
      if (obj[key] === null) {
        obj[key] = '';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        replaceNullsInObject(obj[key]);
      }
    });
  };

  data.forEach(replaceNullsInObject);
}

// Get max for any object kind that implements comparison
export const maxObj = (arr: any[]) => arr.reduce((a, b) => (a > b ? a : b));
