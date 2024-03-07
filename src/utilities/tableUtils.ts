import { MRT_ColumnDef } from 'material-react-table';
import { DataTableFilterMeta } from 'primereact/datatable';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
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

export function buildPrimeReactColumnDefinitions(fields: Field[]) {
  const columnBuilder: {
    field: string,
    header: string,
    dataType?: string,
    hidden?: boolean,
    body?: (rowData: any) => React.ReactNode, }[] = [];

  fields.forEach((field: Field) => {
    if (field.columnName in fieldRenderFunctions) {
      columnBuilder.push({
        field: field.columnName,
        header: field.columnName,
        body: (rowData: any) => fieldRenderFunctions[field.columnName](rowData[field.columnName]),
      });
    } else if (field.primitiveType && field.primitiveType in typeRenderFunctions) {
      columnBuilder.push({
        field: field.columnName,
        header: field.columnName,
        body: (rowData: any) =>
          typeRenderFunctions[field.primitiveType!](rowData[field.columnName]),
      });
    } else {
      columnBuilder.push({
        field: field.columnName,
        header: `${field.columnName}`,
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
