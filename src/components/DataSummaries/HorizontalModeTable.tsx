import { Typography } from '@mui/material';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { DataTable } from 'primereact/datatable';
import { Row } from 'primereact/row';
import { type ReactNode, useMemo, useRef } from 'react';
import { AGG_TYPE_LABELS, type PivotConfig, TOTAL_FIELD } from './dataSummariesMeta';
import { PivotCell } from './PivotCell'; // Custom or inline cell renderer

interface HorizontalModeTableProps {
  horizontalTableRows: Record<string, unknown>[];
  horizontalColumnTotals: Record<string, number>;
  pivotConfig: PivotConfig;
  fieldLabelByKey: Record<string, string>;
  headerControls: ReactNode;
  emptyStateMessage: ReactNode;
  shouldShowTable: boolean;
}

export function HorizontalModeTable({
  horizontalTableRows,
  horizontalColumnTotals,
  pivotConfig,
  fieldLabelByKey,
  headerControls,
  emptyStateMessage,
  shouldShowTable,
}: HorizontalModeTableProps) {
  const tableRef = useRef<DataTable<Record<string, unknown>[]>>(null);

  // Key needs to be updated when any configuration or underlying data changes (including filtering, stale data refresh, etc.)
  // Otherwise DataTable does not handle all rendering changes correctly (row spans not updating correctly)
  const tableKey = useMemo(() => `horizontal_${JSON.stringify(pivotConfig)}`, [pivotConfig]);

  return (
    <DataTable
      key={tableKey}
      ref={tableRef}
      value={shouldShowTable ? horizontalTableRows : []}
      size="small"
      showGridlines
      className="my-flexible-table"
      scrollable
      scrollHeight="flex"
      rowGroupMode="rowspan" // Requires pre-sorting of rows by group-by fields
      // Limitation of the current implementation: DataTable is designed for single-level grouping only
      // This means that if the user selects multiple group-by fields, only the first one will be used for grouping in the table display
      groupRowsBy={pivotConfig.groupByFields.length > 0 ? pivotConfig.groupByFields[0] : undefined}
      emptyMessage={emptyStateMessage}
      header={headerControls}
      headerColumnGroup={
        <ColumnGroup>
          <Row>
            {pivotConfig.groupByFields.map((col) => (
              <Column
                key={col}
                header={fieldLabelByKey[col] ?? col}
                rowSpan={2}
                className="flexible-column"
                bodyClassName="value-cells"
              />
            ))}
            <Column
              header="Total records"
              rowSpan={2}
              className="flexible-column"
              bodyClassName="value-cells"
            />
            {pivotConfig.displayFields.map((col) => {
              const aggsForCol = pivotConfig.selectedAggregations[col] ?? [];
              if (aggsForCol.length === 0) return null;
              return (
                <Column
                  key={col}
                  header={fieldLabelByKey[col] ?? col}
                  colSpan={aggsForCol.length}
                  className="flexible-column"
                  bodyClassName="value-cells"
                />
              );
            })}
          </Row>
          <Row>
            {pivotConfig.displayFields.flatMap((col) =>
              (pivotConfig.selectedAggregations[col] ?? []).map((agg) => (
                <Column
                  key={`${col}__${agg}`}
                  header={AGG_TYPE_LABELS[agg]}
                  className="flexible-column"
                  bodyClassName="value-cells"
                />
              )),
            )}
          </Row>
        </ColumnGroup>
      }
      footerColumnGroup={
        pivotConfig.showTotalCountFooter ? (
          <ColumnGroup>
            <Row>
              {pivotConfig.groupByFields.map((col, index) => (
                <Column
                  key={`footer_groupby_${col}`}
                  footer={index === 0 ? 'Total' : ''}
                  footerStyle={{ fontWeight: 'bold' }}
                  className="flexible-column"
                />
              ))}
              <Column
                key="footer_total_records"
                footer={
                  <Typography fontWeight="bold">
                    {pivotConfig.groupByFields.length === 0
                      ? `Total (${horizontalColumnTotals[TOTAL_FIELD] ?? 0})`
                      : (horizontalColumnTotals[TOTAL_FIELD] ?? 0)}
                  </Typography>
                }
                className="flexible-column"
              />
              {pivotConfig.displayFields.flatMap((col) =>
                (pivotConfig.selectedAggregations[col] ?? []).map((agg) => {
                  const key = `${col}__${agg}`;
                  return (
                    <Column
                      key={`footer_agg_${key}`}
                      footer={horizontalColumnTotals[key] ?? '—'}
                      footerStyle={{ fontWeight: 'bold' }}
                      className="flexible-column"
                    />
                  );
                }),
              )}
            </Row>
          </ColumnGroup>
        ) : null
      }
    >
      {pivotConfig.groupByFields.map((col) => (
        <Column key={col} field={col} className="flexible-column" bodyClassName="value-cells" />
      ))}
      <Column
        field={TOTAL_FIELD}
        className="flexible-column"
        bodyClassName="value-cells"
        body={(rowData) => (
          <PivotCell
            value={rowData[TOTAL_FIELD]}
            percentage={rowData[`${TOTAL_FIELD}__pct`]}
            showPercentage={pivotConfig.showRelativePercentages}
          />
        )}
      />
      {pivotConfig.displayFields.flatMap((col) =>
        (pivotConfig.selectedAggregations[col] ?? []).map((agg) => {
          const key = `${col}__${agg}`;
          return (
            <Column
              key={key}
              field={key}
              className="flexible-column"
              bodyClassName="value-cells"
              body={(rowData) => (
                <PivotCell
                  value={rowData[key]}
                  percentage={rowData[`${key}__pct`]}
                  showPercentage={pivotConfig.showRelativePercentages}
                />
              )}
            />
          );
        }),
      )}
    </DataTable>
  );
}
