import FieldTypes from '../../constants/fieldTypes';
import {
  AGG_TYPE_DEFAULT,
  AggregationType,
  ALL_SAMPLES_KEY,
  BLANK_GROUP_VALUE,
  DateGranularity,
  FIELD_TYPE_AGGREGATION_TYPES,
  type FieldTypeMap,
  GROUP_KEY_SEPARATOR,
  type GroupByBinSizeMap,
  type GroupByGranularityMap,
  OTHER_GROUP_VALUE,
  type PivotGroup,
  type PivotGroupBucket,
  type RowRecord,
} from './dataSummariesMeta';

// Buckets a date value into a string representation of the bucket based on the specified granularity
function bucketDateValue(value: unknown, granularity: DateGranularity): string {
  const date = toDate(value);
  if (!date) return BLANK_GROUP_VALUE;
  if (granularity === DateGranularity.Year) return String(date.getFullYear());
  if (granularity === DateGranularity.Month)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  if (granularity === DateGranularity.Week)
    return `${date.getFullYear()}-W${String(getISOWeek(date)).padStart(2, '0')}`;
  return date.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

// Buckets a numeric value into a fixed width range
function bucketNumberValue(value: unknown, bucketSize: number): string {
  const valueNumber = toNumber(value);
  if (valueNumber === null || !Number.isFinite(bucketSize) || bucketSize <= 0) {
    return BLANK_GROUP_VALUE;
  }

  const bucketStart = Math.floor(valueNumber / bucketSize) * bucketSize;
  const bucketEnd = bucketStart + bucketSize;

  const format = (num: number) => (Number.isInteger(bucketSize) ? num : Number(num.toFixed(2)));

  return `${format(bucketStart)}-${format(bucketEnd)}`;
}

// Calculates a suggested bucket size for numeric columns based on the range of values in the data
export function computeSuggestedBinSize(rows: RowRecord[], col: string): number {
  const numbers = rows.map((row) => toNumber(row[col])).filter((n): n is number => n !== null);
  if (numbers.length === 0) return 1;
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const range = max - min;
  const rawBinSize = range > 0 ? range / 10 : 1;
  // Round to nearest order of magnitude for better readability
  const orderOfMagnitude = 10 ** Math.floor(Math.log10(rawBinSize));
  const roundedBinSize = Math.round(rawBinSize / orderOfMagnitude) * orderOfMagnitude;
  return roundedBinSize;
}

function makeGroupKey(values: string[]): string {
  return values.join(GROUP_KEY_SEPARATOR);
}

// Sorts group keys in this order:
// 1. Sorted string values
// 2. Numeric values in ascending order
// 3. Blank values
// 4. "Other"
function sortGroupKeys(a: string, b: string, fieldType: FieldTypes): number {
  if (a === BLANK_GROUP_VALUE) return 1;
  if (b === BLANK_GROUP_VALUE) return -1;

  if (a === OTHER_GROUP_VALUE) return 1;
  if (b === OTHER_GROUP_VALUE) return -1;

  if (fieldType === FieldTypes.NUMBER || fieldType === FieldTypes.DOUBLE) {
    if (a === BLANK_GROUP_VALUE) return 1;
    if (b === BLANK_GROUP_VALUE) return -1;
    const na = Number.parseFloat(a);
    const nb = Number.parseFloat(b);

    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  }
  return a.localeCompare(b);
}

function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

// Pivot table aggregation function helpers
function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return null;
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

const PIVOT_AGGREGATION_FUNCTIONS: Record<AggregationType, (values: unknown[]) => number | null> = {
  [AggregationType.Total]: (values) => values.length,
  [AggregationType.NonEmpty]: (values) => values.filter((v) => !isEmptyValue(v)).length,
  [AggregationType.Empty]: (values) => values.filter((v) => isEmptyValue(v)).length,
  [AggregationType.Unique]: (values) =>
    new Set(values.filter((v) => !isEmptyValue(v)).map(String)).size,

  [AggregationType.Sum]: (values) => {
    const numbers = values.map(toNumber).filter((n): n is number => n !== null);
    return numbers.reduce((a, b) => a + b, 0);
  },
  [AggregationType.Min]: (values) => {
    const numbers = values.map(toNumber).filter((n): n is number => n !== null);
    return numbers.length ? Math.min(...numbers) : null;
  },
  [AggregationType.Max]: (values) => {
    const numbers = values.map(toNumber).filter((n): n is number => n !== null);
    return numbers.length ? Math.max(...numbers) : null;
  },
  [AggregationType.Mean]: (values) => {
    const numbers = values.map(toNumber).filter((n): n is number => n !== null);
    return numbers.length ? numbers.reduce((a, b) => a + b, 0) / numbers.length : null;
  },
  [AggregationType.Median]: (values) => {
    const numbers = values
      .map(toNumber)
      .filter((n): n is number => n !== null)
      .sort((a, b) => a - b);
    if (!numbers.length) return null;
    const mid = Math.floor(numbers.length / 2);
    return numbers.length % 2 ? numbers[mid] : (numbers[mid - 1] + numbers[mid]) / 2;
  },
};

function computeCounts(
  rows: RowRecord[],
  displayFields: string[],
  fieldTypes: FieldTypeMap,
  selectedAggregations: Record<string, AggregationType[]>,
): Record<string, Partial<Record<AggregationType, number | null>>> {
  const counts: Record<string, Partial<Record<AggregationType, number | null>>> = {};

  for (const col of displayFields) {
    const fieldType = fieldTypes[col];
    const allowedTypes = FIELD_TYPE_AGGREGATION_TYPES[fieldType] ?? AGG_TYPE_DEFAULT;
    const requestedTypes = selectedAggregations[col] ?? AGG_TYPE_DEFAULT;

    // Only run aggregations that are valid for this field's type
    const typesToRun = requestedTypes.filter((t) => allowedTypes.includes(t));

    const values = rows.map((row) => row[col]);
    const entry: Partial<Record<AggregationType, number | null>> = {};
    for (const type of typesToRun) {
      entry[type] = PIVOT_AGGREGATION_FUNCTIONS[type](values);
    }
    counts[col] = entry;
  }

  return counts;
}

// Resolves the value for a group-by column based on the field type and any specified granularity or bin size
// Returns a string representation of the bucketed value, or a placeholder for empty values
// Note: Here we call granularity/bin size a "bucket"
function resolveGroupValue(
  row: RowRecord,
  col: string,
  fieldTypes: FieldTypeMap,
  groupByGranularity: GroupByGranularityMap,
  groupByBinSize: GroupByBinSizeMap,
): string {
  const fieldType = fieldTypes[col];
  if (fieldType === FieldTypes.DATE) {
    const granularity = groupByGranularity[col] ?? DateGranularity.Month;
    return bucketDateValue(row[col], granularity);
  }
  if (fieldType === FieldTypes.NUMBER || fieldType === FieldTypes.DOUBLE) {
    const bucketSize = groupByBinSize[col];

    if (bucketSize !== undefined) {
      return bucketNumberValue(row[col], bucketSize);
    }
  }
  const value = row[col];
  return isEmptyValue(value) ? BLANK_GROUP_VALUE : String(value);
}

export function buildPivotGroups(
  rows: RowRecord[],
  groupByFields: string[],
  displayFields: string[],
  fieldTypes: FieldTypeMap,
  selectedAggregations: Record<string, AggregationType[]>,
  groupByGranularity: GroupByGranularityMap,
  groupByBinSize: GroupByBinSizeMap,
): PivotGroup[] {
  // If no group-by fields are selected, return a single group representing all samples
  if (groupByFields.length === 0) {
    return [
      {
        key: ALL_SAMPLES_KEY,
        groupValues: {},
        rowCount: rows.length,
        counts: computeCounts(rows, displayFields, fieldTypes, selectedAggregations),
      },
    ];
  }

  // Create a map to hold the grouped rows, keyed by a composite key of the group-by field values
  const groups = new Map<string, PivotGroupBucket>();

  // Iterate through each row and assign it to the appropriate group based on the group-by field values
  for (const row of rows) {
    const groupValues: Record<string, string> = {};
    for (const col of groupByFields) {
      groupValues[col] = resolveGroupValue(
        row,
        col,
        fieldTypes,
        groupByGranularity,
        groupByBinSize,
      );
    }
    const key = makeGroupKey(groupByFields.map((col) => groupValues[col]));

    let group = groups.get(key);
    if (!group) {
      group = { key, groupValues, rows: [] };
      groups.set(key, group);
    }
    group.rows.push(row);
  }

  // Convert the groups map into an array of PivotGroup objects, computing counts for each group
  const groupsArray: PivotGroup[] = Array.from(groups.values()).map((group) => ({
    key: group.key,
    groupValues: group.groupValues,
    rowCount: group.rows.length,
    counts: computeCounts(group.rows, displayFields, fieldTypes, selectedAggregations),
  }));

  // Sort group by fields to give nested look
  groupsArray.sort((a, b) => {
    for (const col of groupByFields) {
      const compare = sortGroupKeys(a.groupValues[col], b.groupValues[col], fieldTypes[col]);
      if (compare !== 0) return compare;
    }
    return 0;
  });

  return groupsArray;
}
