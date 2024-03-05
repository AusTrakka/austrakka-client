import { MRT_ColumnDef } from 'material-react-table';
import { Field } from '../types/dtos';
import { fieldRenderFunctions, typeRenderFunctions } from './helperUtils';
import { Sample } from '../types/sample.interface';

export const compareFields = (field1: Field, field2: Field) =>
  field1.columnOrder - field2.columnOrder;

export function buildMRTColumnDefinitions(fields: Field[]) {
  const columnBuilder: React.SetStateAction<MRT_ColumnDef<Sample>[]> = [];

  fields.forEach((element: Field) => {
    if (element.columnName in fieldRenderFunctions) {
      columnBuilder.push({
        accessorKey: element.columnName,
        header: `${element.columnName}`,
        Cell: ({ cell }) => fieldRenderFunctions[element.columnName](cell.getValue()),
      });
    } else if (element.primitiveType && element.primitiveType in typeRenderFunctions) {
      columnBuilder.push({
        accessorKey: element.columnName,
        header: `${element.columnName}`,
        Cell: ({ cell }) => typeRenderFunctions[element.primitiveType!](cell.getValue()),
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

export function buildTabulatorColumnDefinitions(fields: Field[]) {
  const columnBuilder: { title: string; field: string; }[] = [];

  fields.forEach((element: Field) => {
    columnBuilder.push({
      title: `${element.columnName}`,
      field: element.columnName,
    });
  });

  return columnBuilder;
}
