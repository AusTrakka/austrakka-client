import { useMemo } from 'react';
import {
  AGG_TYPE_LABELS,
  type PivotConfig,
  type PivotGroup,
  SUMMABLE_AGGREGATION_TYPES,
  TOTAL_FIELD,
} from '../dataSummariesMeta';

interface UseHorizontalPivotDataParams {
  pivotGroups: PivotGroup[];
  pivotConfig: PivotConfig;
  fieldLabelByKey: Record<string, string>;
  shouldShowTable: boolean;
}

export function useHorizontalPivotData({
  pivotGroups,
  pivotConfig,
  fieldLabelByKey,
  shouldShowTable,
}: UseHorizontalPivotDataParams) {
  // Compute horizontal table rows
  const tableRows = useMemo(
    () =>
      pivotGroups.map((group) => {
        const row: Record<string, unknown> = {
          ...group.groupValues,
          [TOTAL_FIELD]: group.rowCount,
          [`${TOTAL_FIELD}__pct`]: group.rowCountPercentage,
        };
        for (const col of pivotConfig.displayFields) {
          const aggsForCol = pivotConfig.selectedAggregations[col] ?? [];
          for (const agg of aggsForCol) {
            const key = `${col}__${agg}`;
            row[key] = group.counts[col]?.[agg] ?? null;
            row[`${key}__pct`] = group.percentages?.[col]?.[agg] ?? null;
          }
        }
        return row;
      }),
    [pivotGroups, pivotConfig.displayFields, pivotConfig.selectedAggregations],
  );

  // Compute horizontal column totals
  const columnTotals = useMemo(() => {
    if (!shouldShowTable || tableRows.length === 0) return {};

    const totals: Record<string, number> = {};

    totals[TOTAL_FIELD] = tableRows.reduce(
      (accumulatedCount, row) => accumulatedCount + (Number(row[TOTAL_FIELD]) || 0),
      0,
    );

    for (const col of pivotConfig.displayFields) {
      const aggsForCol = pivotConfig.selectedAggregations[col] ?? [];
      for (const agg of aggsForCol) {
        if (!SUMMABLE_AGGREGATION_TYPES.has(agg)) continue;

        const key = `${col}__${agg}`;
        totals[key] = tableRows.reduce((accumulatedCount, row) => {
          const val = Number(row[key]);
          return accumulatedCount + (Number.isFinite(val) ? val : 0);
        }, 0);
      }
    }

    return totals;
  }, [shouldShowTable, tableRows, pivotConfig.displayFields, pivotConfig.selectedAggregations]);

  // Compute export headers
  const exportHeaders = useMemo(() => {
    const headers: string[] = [];

    for (const col of pivotConfig.groupByFields) {
      headers.push(fieldLabelByKey[col] ?? col);
    }

    headers.push('Total Records');

    // Display fields & aggregation headers
    for (const col of pivotConfig.displayFields) {
      const colLabel = fieldLabelByKey[col] ?? col;
      const aggsForCol = pivotConfig.selectedAggregations[col] ?? [];
      for (const agg of aggsForCol) {
        const aggLabel = AGG_TYPE_LABELS[agg] ?? agg;
        headers.push(`${colLabel} (${aggLabel})`);
      }
    }

    return headers;
  }, [
    pivotConfig.groupByFields,
    pivotConfig.displayFields,
    pivotConfig.selectedAggregations,
    fieldLabelByKey,
  ]);

  // Compute export rows
  const exportRows = useMemo(() => {
    if (!shouldShowTable) return [];

    const rows = tableRows.map((row) => {
      const exportRow: Record<string, unknown> = {};

      for (const col of pivotConfig.groupByFields) {
        const label = fieldLabelByKey[col] ?? col;
        exportRow[label] = row[col] ?? '';
      }

      exportRow['Total Records'] = row[TOTAL_FIELD] ?? 0;

      for (const col of pivotConfig.displayFields) {
        const colLabel = fieldLabelByKey[col] ?? col;
        const aggsForCol = pivotConfig.selectedAggregations[col] ?? [];
        for (const agg of aggsForCol) {
          const key = `${col}__${agg}`;
          const aggLabel = AGG_TYPE_LABELS[agg] ?? agg;
          const headerLabel = `${colLabel} (${aggLabel})`;

          exportRow[headerLabel] = row[key] ?? '';
        }
      }

      return exportRow;
    });

    if (pivotConfig.showTotalCountFooter && Object.keys(columnTotals).length > 0) {
      const totalsRow: Record<string, unknown> = {};

      for (let i = 0; i < pivotConfig.groupByFields.length; i++) {
        const col = pivotConfig.groupByFields[i];
        const label = fieldLabelByKey[col] ?? col;
        totalsRow[label] = i === 0 ? 'Total' : '';
      }

      totalsRow['Total Records'] = columnTotals[TOTAL_FIELD] ?? 0;

      for (const col of pivotConfig.displayFields) {
        const colLabel = fieldLabelByKey[col] ?? col;
        const aggsForCol = pivotConfig.selectedAggregations[col] ?? [];
        for (const agg of aggsForCol) {
          const key = `${col}__${agg}`;
          const aggLabel = AGG_TYPE_LABELS[agg] ?? agg;
          const headerLabel = `${colLabel} (${aggLabel})`;

          totalsRow[headerLabel] = columnTotals[key] ?? '—';
        }
      }

      rows.push(totalsRow);
    }

    return rows;
  }, [shouldShowTable, tableRows, columnTotals, pivotConfig, fieldLabelByKey]);

  return {
    tableRows,
    columnTotals,
    exportHeaders,
    exportRows,
  };
}
