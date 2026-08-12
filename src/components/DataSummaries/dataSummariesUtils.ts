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
  type GroupByTopNMap,
  OTHER_GROUP_VALUE,
  type PivotGroup,
  type PivotOptions,
  ROW_COUNT_AGGREGATION_TYPES,
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
  return date.toISOString().slice(0, 10);
}

function getTopNKeys(
  rows: RowRecord[],
  col: string,
  topNSize: number | string,
  fieldTypes: FieldTypeMap,
  groupByGranularity: GroupByGranularityMap,
  groupByBinSize: GroupByBinSizeMap,
): Set<string> {
  const numericSize =
    typeof topNSize === 'number' ? topNSize : Number.parseInt(String(topNSize), 10);
  if (!Number.isFinite(numericSize) || numericSize <= 0) return new Set();

  const counts = new Map<string, number>();
  for (const row of rows) {
    const bucketLabel = resolveGroupValueForNode(
      row,
      col,
      fieldTypes,
      groupByGranularity,
      groupByBinSize,
    );
    if (bucketLabel === BLANK_GROUP_VALUE) continue;
    counts.set(bucketLabel, (counts.get(bucketLabel) ?? 0) + 1);
  }

  const sortedKeys = Array.from(counts.entries())
    .sort((a, b) => (b[1] !== a[1] ? b[1] - a[1] : a[0].localeCompare(b[0])))
    .slice(0, numericSize)
    .map(([k]) => k);

  return new Set(sortedKeys);
}

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

// Fixed sort logic with proper equality handling
function sortGroupKeys(a: string, b: string, fieldType: FieldTypes): number {
  if (a === b) return 0; // Ensures strict weak ordering

  if (a === BLANK_GROUP_VALUE) return 1;
  if (b === BLANK_GROUP_VALUE) return -1;

  if (a === OTHER_GROUP_VALUE) return 1;
  if (b === OTHER_GROUP_VALUE) return -1;

  if (fieldType === FieldTypes.NUMBER || fieldType === FieldTypes.DOUBLE) {
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

function resolveGroupValueForNode(
  row: RowRecord,
  col: string,
  fieldTypes: FieldTypeMap,
  groupByGranularity: GroupByGranularityMap,
  groupByBinSize: GroupByBinSizeMap,
  topNSet?: Set<string>,
): string {
  const fieldType = fieldTypes[col];
  const rawValue = row[col];
  let bucketLabel: string;

  // STEP 1: Binning and label transformation
  if (isEmptyValue(rawValue)) {
    bucketLabel = BLANK_GROUP_VALUE;
  } else if (fieldType === FieldTypes.DATE) {
    const granularity = groupByGranularity[col] ?? DateGranularity.Month;
    bucketLabel = bucketDateValue(rawValue, granularity);
  } else if (
    (fieldType === FieldTypes.NUMBER || fieldType === FieldTypes.DOUBLE) &&
    groupByBinSize[col] !== undefined
  ) {
    bucketLabel = bucketNumberValue(rawValue, groupByBinSize[col]!);
  } else {
    bucketLabel = String(rawValue);
  }

  // STEP 2: Top-N evaluation (applies to ALL binned field types)
  if (topNSet) {
    if (bucketLabel === BLANK_GROUP_VALUE || !topNSet.has(bucketLabel)) {
      return OTHER_GROUP_VALUE;
    }
  }

  return bucketLabel;
}

export function buildPivotGroups(
  rows: RowRecord[],
  groupByFields: string[],
  displayFields: string[],
  fieldTypes: FieldTypeMap,
  selectedAggregations: Record<string, AggregationType[]>,
  groupByGranularity: GroupByGranularityMap,
  groupByBinSize: GroupByBinSizeMap,
  groupByTopNSize: GroupByTopNMap,
  groupByTopNGlobal: Record<string, boolean>,
  options: PivotOptions = {},
): PivotGroup[] {
  let pivotGroups: PivotGroup[] = [];

  // 1. Handle case with no group-by fields
  if (groupByFields.length === 0) {
    pivotGroups = [
      {
        key: ALL_SAMPLES_KEY,
        groupValues: {},
        rowCount: rows.length,
        counts: computeCounts(rows, displayFields, fieldTypes, selectedAggregations),
      },
    ];
  } else {
    // Pre-calculate Top-N sets per field across the global dataset for consistent row-span layout
    const topNSets: Record<string, Set<string>> = {};
    for (const col of groupByFields) {
      if (groupByTopNSize[col] !== undefined && groupByTopNGlobal[col] === true) {
        topNSets[col] = getTopNKeys(
          rows,
          col,
          groupByTopNSize[col]!,
          fieldTypes,
          groupByGranularity,
          groupByBinSize,
        );
      }
    }

    function groupRecursively(
      currentRows: RowRecord[],
      fieldIndex: number,
      accumulatedGroupValues: Record<string, string>,
    ): PivotGroup[] {
      // Base case: Compute raw group counts for leaf node
      if (fieldIndex >= groupByFields.length) {
        const key = makeGroupKey(groupByFields.map((f) => accumulatedGroupValues[f]));
        const groupCounts = computeCounts(
          currentRows,
          displayFields,
          fieldTypes,
          selectedAggregations,
        );

        return [
          {
            key,
            groupValues: { ...accumulatedGroupValues },
            rowCount: currentRows.length,
            counts: groupCounts,
          },
        ];
      }

      const col = groupByFields[fieldIndex];
      const fieldType = fieldTypes[col];

      const topNMode = groupByTopNGlobal[col];
      let topNSet: Set<string> | undefined;
      if (topNMode !== undefined) {
        topNSet = topNMode
          ? topNSets[col]
          : getTopNKeys(
              currentRows,
              col,
              groupByTopNSize[col],
              fieldTypes,
              groupByGranularity,
              groupByBinSize,
            );
      }

      const buckets = new Map<string, RowRecord[]>();
      for (const row of currentRows) {
        const groupVal = resolveGroupValueForNode(
          row,
          col,
          fieldTypes,
          groupByGranularity,
          groupByBinSize,
          topNSet,
        );
        let bucket = buckets.get(groupVal);
        if (!bucket) {
          bucket = [];
          buckets.set(groupVal, bucket);
        }
        bucket.push(row);
      }

      const sortedGroupValues = Array.from(buckets.keys()).sort((a, b) =>
        sortGroupKeys(a, b, fieldType),
      );

      const results: PivotGroup[] = [];
      for (const val of sortedGroupValues) {
        // Filter out blank/null category groups if hideEmptyNullGroups option is active
        if (options.hideEmptyNullGroups && val === BLANK_GROUP_VALUE) {
          continue;
        }
        const subRows = buckets.get(val)!;
        const nextGroupValues = { ...accumulatedGroupValues, [col]: val };
        results.push(...groupRecursively(subRows, fieldIndex + 1, nextGroupValues));
      }

      return results;
    }

    pivotGroups = groupRecursively(rows, 0, {});
  }

  // 2. Post-process relative percentages based strictly on TOTAL VISIBLE DATASET
  if (options.showRelativePercentages) {
    // Single global denominator across all metrics
    const visibleTotalRows = pivotGroups.reduce((sum, g) => sum + g.rowCount, 0);

    for (const group of pivotGroups) {
      // Group row count %
      group.rowCountPercentage =
        visibleTotalRows > 0 ? Number(((group.rowCount / visibleTotalRows) * 100).toFixed(2)) : 0;

      // Aggregation field % (relative to total dataset)
      group.percentages = {};
      for (const col of displayFields) {
        group.percentages[col] = {};
        for (const agg of selectedAggregations[col] ?? []) {
          const groupVal = group.counts[col]?.[agg];

          // Only compute percentage for row-count aggregations
          if (
            ROW_COUNT_AGGREGATION_TYPES.has(agg) &&
            typeof groupVal === 'number' &&
            visibleTotalRows > 0
          ) {
            group.percentages[col][agg] = Number(((groupVal / visibleTotalRows) * 100).toFixed(2));
          } else {
            // Remaining aggregation types are not relative to total dataset, so we set them to null
            group.percentages[col][agg] = null;
          }
        }
      }
    }
  }

  return pivotGroups;
}
