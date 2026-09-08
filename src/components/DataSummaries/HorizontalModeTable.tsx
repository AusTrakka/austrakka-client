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

  // Key needs to be updated when configuration or underlying data changes
  const tableKey = useMemo(() => `horizontal_${JSON.stringify(pivotConfig)}`, [pivotConfig]);

  // Determine if there are active sub-header columns (aggregations)
  const hasSubHeaders = useMemo(() => {
    return pivotConfig.displayFields.some((col) => {
      const aggs = pivotConfig.selectedAggregations[col];
      return Array.isArray(aggs) && aggs.length > 0;
    });
  }, [pivotConfig.displayFields, pivotConfig.selectedAggregations]);

  // If there are no sub-headers, rowSpan must be 1 to prevent Chrome from rendering phantom row height
  const headerRowSpan = hasSubHeaders ? 2 : 1;

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
      rowGroupMode="rowspan"
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
                rowSpan={headerRowSpan}
                className="flexible-column"
                bodyClassName="value-cells"
              />
            ))}
            <Column
              header="Total records"
              rowSpan={headerRowSpan}
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

          {/* Only render the second header row if sub-headers actually exist */}
          {hasSubHeaders && (
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
          )}
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
