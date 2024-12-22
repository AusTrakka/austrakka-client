export function isNullOrEmpty(value: any) {
  // null, undefined, empty; but not false or 0
  return (value == null || value === '');
}

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
    // NB "Available" not "Present": some default behaviours work better with alphabetical ordering Available,Missing!
    return [
      { status: 'Available', sampleCount: 0 },
      { status: 'Missing', sampleCount: 0 },
    ];
  }
  
  let presentCount = 0;
  array.forEach((item) => {
    if (item && typeof item === 'object' && property in item) {
      const value = item[property];
      // Note that false counts as present
      if (!isNullOrEmpty(value)) {
        presentCount += 1;
      }
    }
  });
  
  return [
    { status: 'Available', sampleCount: presentCount },
    { status: 'Missing', sampleCount: array.length - presentCount },
  ];
}

export function countPresentOrMissingByCategory(property: string, category: string, array: Array<any>) : Record<string, number>[] {
  if (!array || !Array.isArray(array)) return [];
  
  const map = new Map();
  array.forEach((item) => {
    if (item && typeof item === 'object') {
      // throw error if category or property missing
      if (!Object.hasOwn(item, property)) {
        throw new Error(`Property ${property} missing from object when counting present or missing`);
      }
      if (!Object.hasOwn(item, category)) {
        throw new Error(`Category ${category} missing from object when counting present or missing`);
      }
      const value = item[property];
      const cat = item[category];
      if (map.has(cat)) {
        if (!isNullOrEmpty(value)) {
          map.set(cat, [map.get(cat)[0] + 1, map.get(cat)[1]]);
        } else {
          map.set(cat, [map.get(cat)[0], map.get(cat)[1] + 1]);
        }
      } else {
        map.set(cat, [isNullOrEmpty(value) ? 0 : 1, isNullOrEmpty(value) ? 1 : 0]);
      }
    }
  });
  
  const result = [];
  for (const [key, value] of map) {
    result.push(
      { [category]: key, 'Available': value[0], 'Missing': value[1] },
    );
  }
  return result;
}

// Get max or min for any object kind that implements comparison
export const maxObj = (arr: any[]) => arr.reduce((a, b) => (a > b ? a : b));
export const minObj = (arr: any[]) => arr.reduce((a, b) => (a < b ? a : b));
