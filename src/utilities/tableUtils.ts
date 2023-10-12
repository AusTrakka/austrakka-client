import { MRT_ColumnDef } from 'material-react-table';
import { DisplayField, MetaDataColumn } from '../types/dtos';
import isoDateLocalDate, { isoDateLocalDateNoTime } from './helperUtils';

// Maps from a hard-coded metadata field name to a function to render the cell value
// Duplicated here for now until Samples.tsx and SampleTable.tsx are merged
export const sampleRenderFunctions : { [index: string]: Function } = {
  'Shared_groups': (value: any) => value.toString().replace(/[[\]"']/g, ''),
};

// Fields which should be rendered as datetimes, not just dates
// This hard-coding is interim until the server is able to provide this information
export const datetimeFields = new Set(['Date_created', 'Date_updated']);

export function compareFields(field1: DisplayField, field2: DisplayField) {
  if (field1.columnOrder < field2.columnOrder) {
    return -1;
  }
  if (field1.columnOrder > field2.columnOrder) {
    return 1;
  }
  return 0;
}

export function buildMRTColumnDefinitions(fields: DisplayField[]) {
  const columnBuilder: React.SetStateAction<MRT_ColumnDef<{}>[]> = [];

  fields.forEach((element: MetaDataColumn) => {
    if (element.columnName in sampleRenderFunctions) {
      columnBuilder.push({
        accessorKey: element.columnName,
        header: `${element.columnName}`,
        Cell: ({ cell }) => sampleRenderFunctions[element.columnName](cell.getValue()),
      });
    } else if (element.primitiveType === 'boolean') {
      columnBuilder.push({
        accessorKey: element.columnName,
        header: `${element.columnName}`,
        Cell: ({ cell }) => (cell.getValue() ? 'true' : 'false'),
      });
    } else if (element.primitiveType === 'date') {
      columnBuilder.push({
        accessorKey: element.columnName,
        header: `${element.columnName}`,
        Cell: ({ cell }: any) => (
          datetimeFields.has(element.columnName)
            ? isoDateLocalDate(cell.getValue())
            : isoDateLocalDateNoTime(cell.getValue())),
      });
    } else {
      columnBuilder.push({
        accessorKey: element.columnName,
        header: `${element.columnName}`,
      });
    }
  });

  return columnBuilder;
}
