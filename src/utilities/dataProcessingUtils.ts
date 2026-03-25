export function isNullOrEmpty(value: any) {
  // null, undefined, empty; but not false or 0
  return value == null || value === '';
}

// Function to aggregate counts of objects in an array, on a certain property
export interface CountRow {
  value: string;
  count: number;
}

export function aggregateArrayObjects(
  property: string,
  array: Array<any>,
  nullPropertyName: string | null = null,
): CountRow[] {
  if (!array || !Array.isArray(array)) {
    return [];
  }

  const aggregatedCounts = [];
  const map = new Map();

  for (let i = 0; i < array.length; i += 1) {
    const item = array[i];

    if (item && typeof item === 'object' && property in item) {
      let value = item[property];
      if (nullPropertyName && isNullOrEmpty(value)) value = nullPropertyName;
      if (map.has(value)) {
        map.set(value, map.get(value) + 1);
      } else {
        map.set(value, 1);
      }
    }
  }

  for (const [key, value] of map) {
    const obj = { value: key, count: value };
    aggregatedCounts.push(obj);
  }

  // If null or nullPropertyName values are present, sort them to the start of the list
  // Otherwise sort by count descending
  aggregatedCounts.sort((a, b) => {
    if (isNullOrEmpty(a.value) || a.value === nullPropertyName) return -1;
    if (isNullOrEmpty(b.value) || b.value === nullPropertyName) return 1;
    return b.count - a.count;
  });

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
      if (!isNullOrEmpty(value)) {
        presentCount += 1;
      }
    }
  });

  return [
    { status: 'Present', sampleCount: presentCount },
    { status: 'Missing', sampleCount: array.length - presentCount },
  ];
}

// Get max or min for any object kind that implements comparison
export const maxObj = (arr: any[]) => arr.reduce((a, b) => (a > b ? a : b));
export const minObj = (arr: any[]) => arr.reduce((a, b) => (a < b ? a : b));

// For use in sorting by multiple properties
// E.g. compareProperties(a, b, [[(x) => x.name, 1], [(x) => x.age, -1]])
export function compareProperties(
  a: any,
  b: any,
  transformFunctions: [(a: any) => any, number][],
): number {
  if (isNullOrEmpty(a) && isNullOrEmpty(b)) return 0;
  for (const [transform, sign] of transformFunctions) {
    const transformedA = transform(a);
    const transformedB = transform(b);
    if (isNullOrEmpty(transformedA) && isNullOrEmpty(transformedB)) continue; // next transform
    if (isNullOrEmpty(transformedA)) return 1; // nulls last, regardless of asc/desc
    if (isNullOrEmpty(transformedB)) return -1;
    if (transformedA < transformedB) return -sign;
    if (transformedA > transformedB) return sign;
  }
  return 0;
}

// Function to get top X categories based on categoryLimit prop
export function topCategories(data: any, field: string, categoryLimit?: number) {
    const categoryCounts: Record<string, number> = {};
    for (const item of data) {
      // Only ignore empty values if categoryLimit is set
      if (categoryLimit && isNullOrEmpty(item[field])) continue;
      const value = item[field];
      categoryCounts[value] = (categoryCounts[value] || 0) + 1;
    }

    const sortedCategories = Object.entries(categoryCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([category]) => category);

    if (categoryLimit) {
      return sortedCategories.slice(0, categoryLimit);
    } else {
      // Just in case of no category limit, return all categories sorted by count
      return sortedCategories;
    }
  };


// Filter data based on array of field/value pairs to exclude
export function filterExcluded(data: any[], exclude?: { field: string; value: string }[]) {
  if (!exclude || exclude.length === 0) return data;
  return data.filter((item) => {
    for (const { field, value } of exclude) {
      if (item[field] === value) {
        return false; // Exclude 
      }
    }
    return true; // Keep
  });
}

// Filter data based on array of field/value pairs to include
// This is currently inclusive AND as this is how filters are applied in sample table
// Can extend to OR or other logic if needed in the future (and if sample table supports this it)
export function filterIncluded(data: any[], include?: { field: string; value: string }[]) {
  if (!include || include.length === 0) return data;
  return data.filter((item) => {
    for (const { field, value } of include) {
      if (item[field] !== value) {
        return false; // If any field does not match, exclude
      }
    }
    return true; // All fields matched, include
  });
}
