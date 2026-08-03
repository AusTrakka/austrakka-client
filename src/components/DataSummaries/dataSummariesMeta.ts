import FieldTypes from '../../constants/fieldTypes';

export enum TableOrientation {
  FieldsHorizontal = 'fieldsHorizontal',
  FieldsVertical = 'fieldsVertical',
}
export const BLANK_GROUP_VALUE = '-';
export const OTHER_GROUP_VALUE = 'Other';
export const GROUP_KEY_SEPARATOR = '_'; // Can change this to something more unique (like a unicode character)
export const ALL_SAMPLES_KEY = 'all';

export enum DateGranularity {
  Year = 'year',
  Month = 'month',
  Week = 'week',
  Day = 'day',
}

export const DATE_GRANULARITY_LABELS: Record<DateGranularity, string> = {
  [DateGranularity.Year]: 'Year',
  [DateGranularity.Month]: 'Month',
  [DateGranularity.Week]: 'Week',
  [DateGranularity.Day]: 'Day',
};

export type RowRecord = Record<string, string | number | boolean | Date | null | undefined>;
export enum AggregationType {
  Total = 'total',
  NonEmpty = 'nonEmpty',
  Empty = 'empty',
  Unique = 'unique',
  Min = 'min',
  Max = 'max',
  Mean = 'mean',
  Median = 'median',
  Sum = 'sum',
}

export const AGG_TYPE_DEFAULT: AggregationType[] = [
  AggregationType.Total,
  AggregationType.NonEmpty,
  AggregationType.Empty,
  AggregationType.Unique,
];

const AGG_TYPE_NUMERIC: AggregationType[] = [
  AggregationType.Sum,
  AggregationType.Min,
  AggregationType.Max,
  AggregationType.Mean,
  AggregationType.Median,
];

export const AGG_TYPE_LABELS: Record<AggregationType, string> = {
  [AggregationType.Total]: 'Total',
  [AggregationType.NonEmpty]: 'Non-empty',
  [AggregationType.Empty]: 'Empty',
  [AggregationType.Unique]: 'Unique values',
  [AggregationType.Min]: 'Minimum',
  [AggregationType.Max]: 'Maximum',
  [AggregationType.Mean]: 'Mean',
  [AggregationType.Median]: 'Median',
  [AggregationType.Sum]: 'Sum',
};

export const FIELD_TYPE_AGGREGATION_TYPES: Record<FieldTypes, AggregationType[]> = {
  [FieldTypes.STRING]: [...AGG_TYPE_DEFAULT],
  [FieldTypes.DATE]: [...AGG_TYPE_DEFAULT],
  [FieldTypes.BOOLEAN]: [...AGG_TYPE_DEFAULT],
  [FieldTypes.NUMBER]: [...AGG_TYPE_DEFAULT, ...AGG_TYPE_NUMERIC],
  [FieldTypes.DOUBLE]: [...AGG_TYPE_DEFAULT, ...AGG_TYPE_NUMERIC],
};

export type FieldTypeMap = Record<string, FieldTypes>;

// Group-by configuration maps
export type GroupByGranularityMap = Record<string, DateGranularity>; // DATE
export type GroupByBinSizeMap = Record<string, number>; // NUMBER/DOUBLE

// Initial pivot config state
export interface PivotConfig {
  groupByFields: string[];
  displayFields: string[];
  selectedAggregations: Record<string, AggregationType[]>;
  groupByGranularity: GroupByGranularityMap;
  groupByBinSize: GroupByBinSizeMap;
}

export interface PivotGroup {
  key: string; // composite key across all group-by fields (or all_samples key if no group-by fields are selected)
  groupValues: Record<string, string>;
  rowCount: number;
  counts: Record<string, Partial<Record<AggregationType, number | null>>>;
}

export interface PivotGroupBucket {
  key: string;
  groupValues: Record<string, string>;
  rows: RowRecord[];
}
