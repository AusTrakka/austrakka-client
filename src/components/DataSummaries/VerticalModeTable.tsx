import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { DataTable, type DataTableFilterMeta } from 'primereact/datatable';
import { Row } from 'primereact/row';
import { useMemo, useRef } from 'react';
import {
  AGG_TYPE_LABELS,
  type AggregationType,
  type PivotConfig,
  TOTAL_FIELD,
} from './dataSummariesMeta';
import { PivotCell } from './PivotCell';

interface VerticalModeTableProps {
  verticalTableRows: Record<string, unknown>[];
  verticalColumnTotals: Record<string, number | string>;
  verticalAggregationColumns: AggregationType[];
  pivotConfig: PivotConfig;
  fieldLabelByKey: Record<string, string>;
  filters: DataTableFilterMeta | undefined;
  headerControls: React.ReactNode;
  emptyStateMessage: React.ReactNode;
  shouldShowTable: boolean;
}

export function VerticalModeTable({
  verticalTableRows,
  verticalColumnTotals,
  verticalAggregationColumns,
  pivotConfig,
  fieldLabelByKey,
  filters,
  headerControls,
  emptyStateMessage,
  shouldShowTable,
}: VerticalModeTableProps) {
  const tableRef = useRef<DataTable<Record<string, unknown>[]>>(null);

  // Filter fields
  const globalFilterFields = useMemo(
    () => ['field', ...pivotConfig.groupByFields, TOTAL_FIELD, ...verticalAggregationColumns],
    [pivotConfig.groupByFields, verticalAggregationColumns],
  );

  const tableKey = useMemo(
    () =>
      `vertical_${pivotConfig.groupByFields.join('_')}_${pivotConfig.displayFields.join('_')}_${
        pivotConfig.showRelativePercentages ? 'pct' : 'raw'
      }`,
    [pivotConfig.groupByFields, pivotConfig.displayFields, pivotConfig.showRelativePercentages],
  );

  return (
    <DataTable
      key={tableKey}
      ref={tableRef}
      value={shouldShowTable ? verticalTableRows : []}
      size="small"
      className="my-flexible-table"
      scrollable
      rowGroupMode="rowspan"
      groupRowsBy={pivotConfig.groupByFields.length > 0 ? pivotConfig.groupByFields[0] : 'field'}
      emptyMessage={emptyStateMessage}
      header={headerControls}
      filters={filters}
      globalFilterFields={globalFilterFields}
      footerColumnGroup={
        pivotConfig.showTotalCountFooter ? (
          <ColumnGroup>
            <Row>
              <Column
                footer="Total (distinct)"
                colSpan={1 + pivotConfig.groupByFields.length}
                footerStyle={{ fontWeight: 'bold' }}
                className="flexible-column"
              />
              {/* Overall total of record counts */}
              <Column
                footer={verticalColumnTotals[TOTAL_FIELD] ?? 0}
                footerStyle={{ fontWeight: 'bold' }}
                className="flexible-column"
              />
              {/* Totals for each aggregation column */}
              {verticalAggregationColumns.map((agg) => (
                <Column
                  key={agg}
                  footer={'—'}
                  footerStyle={{ fontWeight: 'bold' }}
                  className="flexible-column"
                />
              ))}
            </Row>
          </ColumnGroup>
        ) : null
      }
    >
      <Column
        field="field"
        header="Field"
        className="flexible-column"
        bodyClassName="value-cells"
      />
      {pivotConfig.groupByFields.map((col) => (
        <Column
          key={col}
          field={col}
          header={fieldLabelByKey[col] ?? col}
          className="flexible-column"
          bodyClassName="value-cells"
        />
      ))}
      <Column
        field={TOTAL_FIELD}
        header="Total records"
        className="flexible-column"
        bodyClassName="value-cells"
        body={(rowData: Record<string, unknown>) => (
          <PivotCell
            value={rowData[TOTAL_FIELD] as React.ReactNode}
            percentage={rowData[`${TOTAL_FIELD}__pct`] as number | string | null}
            showPercentage={pivotConfig.showRelativePercentages}
          />
        )}
      />
      {verticalAggregationColumns.map((agg) => (
        <Column
          key={agg}
          field={agg}
          header={AGG_TYPE_LABELS[agg]}
          className="flexible-column"
          bodyClassName="value-cells"
          body={(rowData: Record<string, unknown>) => (
            <PivotCell
              value={rowData[agg] as React.ReactNode}
              percentage={rowData[`${agg}__pct`] as number | string | null}
              showPercentage={pivotConfig.showRelativePercentages}
            />
          )}
        />
      ))}
    </DataTable>
  );
}
