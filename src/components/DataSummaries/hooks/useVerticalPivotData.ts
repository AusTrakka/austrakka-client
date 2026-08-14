import { useMemo } from 'react';
import {
  AGG_TYPE_LABELS,
  type AggregationType,
  type PivotConfig,
  type PivotGroup,
  RECORD_COUNT_FALLBACK_KEY,
  TOTAL_FIELD,
} from '../dataSummariesMeta';

interface UseVerticalPivotDataParams {
  pivotGroups: PivotGroup[];
  pivotConfig: PivotConfig;
  fieldLabelByKey: Record<string, string>;
  shouldShowTable: boolean;
}

export function useVerticalPivotData({
  pivotGroups,
  pivotConfig,
  fieldLabelByKey,
  shouldShowTable,
}: UseVerticalPivotDataParams) {
  // Determine active aggregation columns
  const verticalAggregationColumns = useMemo(() => {
    const used = new Set<AggregationType>();
    for (const col of pivotConfig.displayFields) {
      for (const agg of pivotConfig.selectedAggregations[col] ?? []) {
        used.add(agg);
      }
    }
    return (Object.keys(AGG_TYPE_LABELS) as AggregationType[]).filter((agg) => used.has(agg));
  }, [pivotConfig.displayFields, pivotConfig.selectedAggregations]);

  // Compute table display rows
  const tableRows = useMemo(() => {
    const out: Record<string, unknown>[] = [];
    const fieldsToRender =
      pivotConfig.displayFields.length > 0
        ? pivotConfig.displayFields
        : [RECORD_COUNT_FALLBACK_KEY];

    for (const col of fieldsToRender) {
      const isFallback = col === RECORD_COUNT_FALLBACK_KEY;
      const aggsForCol = new Set(pivotConfig.selectedAggregations[col] ?? []);
      for (const group of pivotGroups) {
        const row: Record<string, unknown> = {
          field: isFallback ? '-' : (fieldLabelByKey[col] ?? col),
          ...group.groupValues,
          [TOTAL_FIELD]: group.rowCount,
          [`${TOTAL_FIELD}__pct`]: group.rowCountPercentage,
        };
        for (const agg of verticalAggregationColumns) {
          if (aggsForCol.has(agg)) {
            row[agg] = group.counts[col]?.[agg] ?? null;
            row[`${agg}__pct`] = group.percentages?.[col]?.[agg] ?? null;
          } else {
            row[agg] = '';
          }
        }
        out.push(row);
      }
    }
    return out;
  }, [
    pivotGroups,
    pivotConfig.displayFields,
    pivotConfig.selectedAggregations,
    fieldLabelByKey,
    verticalAggregationColumns,
  ]);

  // Compute table totals
  const grandTotalRecords = useMemo(
    () => pivotGroups.reduce((acc, group) => acc + group.rowCount, 0),
    [pivotGroups],
  );

  const columnTotals = useMemo(() => {
    if (!shouldShowTable || tableRows.length === 0) return {};

    const totals: Record<string, number | string> = {
      [TOTAL_FIELD]: grandTotalRecords,
    };

    // All vertical aggregation column footers are intentionally blank, as they are not summable across groups
    for (const verticalAgg of verticalAggregationColumns) {
      totals[verticalAgg] = '';
    }

    return totals;
  }, [shouldShowTable, tableRows, verticalAggregationColumns, grandTotalRecords]);

  // Compute export headers
  const exportHeaders = useMemo(() => {
    return [
      'Field',
      ...pivotConfig.groupByFields.map((col) => fieldLabelByKey[col] ?? col),
      'Total Records',
      ...verticalAggregationColumns.map((agg) => AGG_TYPE_LABELS[agg]),
    ];
  }, [pivotConfig.groupByFields, fieldLabelByKey, verticalAggregationColumns]);

  const exportRows = useMemo(() => {
    if (!shouldShowTable) return [];

    const rows = tableRows.map((row) => {
      const exportRow: Record<string, unknown> = {};

      exportRow.Field = row.field ?? '';

      for (const col of pivotConfig.groupByFields) {
        const label = fieldLabelByKey[col] ?? col;
        exportRow[label] = row[col] ?? '';
      }

      exportRow['Total Records'] = row[TOTAL_FIELD] ?? 0;

      for (const agg of verticalAggregationColumns) {
        const label = AGG_TYPE_LABELS[agg];
        exportRow[label] = row[agg] ?? '';
      }

      return exportRow;
    });

    if (pivotConfig.showTotalCountFooter && Object.keys(columnTotals).length > 0) {
      const totalsRow: Record<string, unknown> = {};

      totalsRow.Field = 'Total (distinct)';

      for (const col of pivotConfig.groupByFields) {
        const label = fieldLabelByKey[col] ?? col;
        totalsRow[label] = '';
      }

      totalsRow['Total Records'] = columnTotals[TOTAL_FIELD] ?? 0;

      for (const agg of verticalAggregationColumns) {
        const label = AGG_TYPE_LABELS[agg];
        totalsRow[label] = columnTotals[agg] ?? '—';
      }

      rows.push(totalsRow);
    }

    return rows;
  }, [
    shouldShowTable,
    tableRows,
    columnTotals,
    pivotConfig,
    fieldLabelByKey,
    verticalAggregationColumns,
  ]);

  return {
    tableRows,
    columnTotals,
    verticalAggregationColumns,
    exportHeaders,
    exportRows,
  };
}
