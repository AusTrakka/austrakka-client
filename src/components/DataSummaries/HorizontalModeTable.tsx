import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { DataTable, type DataTableFilterMeta } from 'primereact/datatable';
import { Row } from 'primereact/row';
import { useMemo, useRef } from 'react';
import { AGG_TYPE_LABELS, type PivotConfig, TOTAL_FIELD } from './dataSummariesMeta';
import { PivotCell } from './PivotCell'; // Custom or inline cell renderer

interface HorizontalModeTableProps {
  horizontalTableRows: Record<string, unknown>[];
  horizontalColumnTotals: Record<string, number>;
  pivotConfig: PivotConfig;
  fieldLabelByKey: Record<string, string>;
  filters: DataTableFilterMeta | undefined;
  headerControls: React.ReactNode;
  emptyStateMessage: React.ReactNode;
  shouldShowTable: boolean;
}

export function HorizontalModeTable({
  horizontalTableRows,
  horizontalColumnTotals,
  pivotConfig,
  fieldLabelByKey,
  filters,
  headerControls,
  emptyStateMessage,
  shouldShowTable,
}: HorizontalModeTableProps) {
  const tableRef = useRef<DataTable<Record<string, unknown>[]>>(null);

  // Filter fields
  const globalFilterFields = useMemo(() => {
    const fields: string[] = [TOTAL_FIELD, ...pivotConfig.groupByFields];
    for (const col of pivotConfig.displayFields) {
      for (const agg of pivotConfig.selectedAggregations[col] ?? []) {
        fields.push(`${col}__${agg}`);
      }
    }
    return fields;
  }, [pivotConfig.groupByFields, pivotConfig.displayFields, pivotConfig.selectedAggregations]);

  const tableKey = useMemo(
    () =>
      `horizontal_${pivotConfig.groupByFields.join('_')}_${pivotConfig.displayFields.join('_')}_${
        pivotConfig.showRelativePercentages ? 'pct' : 'raw'
      }`,
    [pivotConfig.groupByFields, pivotConfig.displayFields, pivotConfig.showRelativePercentages],
  );

  return (
    <DataTable
      key={tableKey}
      ref={tableRef}
      value={shouldShowTable ? horizontalTableRows : []}
      size="small"
      className="my-flexible-table"
      scrollable
      rowGroupMode="rowspan"
      // Limitation of the current implementation: DataTable is designed for single-level grouping only
      // This means that if the user selects multiple group-by fields, only the first one will be used for grouping in the table display
      groupRowsBy={pivotConfig.groupByFields.length > 0 ? pivotConfig.groupByFields[0] : undefined}
      emptyMessage={emptyStateMessage}
      header={headerControls}
      filters={filters}
      globalFilterFields={globalFilterFields}
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
                  pivotConfig.groupByFields.length === 0
                    ? `Total (${horizontalColumnTotals[TOTAL_FIELD] ?? 0})`
                    : (horizontalColumnTotals[TOTAL_FIELD] ?? 0)
                }
                footerStyle={{ fontWeight: 'bold' }}
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
