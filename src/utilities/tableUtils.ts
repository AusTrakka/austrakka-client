import { MRT_ColumnDef } from 'material-react-table';
import { MetaDataColumn, ProjectField } from '../types/dtos';
import { fieldRenderFunctions, typeRenderFunctions } from './helperUtils';
import { Sample } from '../types/sample.interface';

export function compareFields(
  field1: ProjectField | MetaDataColumn,
  field2: ProjectField | MetaDataColumn,
) {
  if (field1.columnOrder < field2.columnOrder) {
    return -1;
  }
  if (field1.columnOrder > field2.columnOrder) {
    return 1;
  }
  return 0;
}

export function buildMRTColumnDefinitions(fields: ProjectField[]) {
  const columnBuilder: React.SetStateAction<MRT_ColumnDef<Sample>[]> = [];

  fields.forEach((element: ProjectField) => {
    if (element.fieldName in fieldRenderFunctions) {
      columnBuilder.push({
        accessorKey: element.fieldName,
        header: `${element.fieldName}`,
        Cell: ({ cell }) => fieldRenderFunctions[element.fieldName](cell.getValue()),
      });
    } else if (element.fieldDataType && element.fieldDataType in typeRenderFunctions) {
      columnBuilder.push({
        accessorKey: element.fieldName,
        header: `${element.fieldName}`,
        Cell: ({ cell }) => typeRenderFunctions[element.fieldDataType!](cell.getValue()),
      });
    } else {
      columnBuilder.push({
        accessorKey: element.fieldName,
        header: `${element.fieldName}`,
      });
    }
  });

  return columnBuilder;
}

export function buildTabulatorColumnDefinitions(fields: MetaDataColumn[]) {
  const columnBuilder: { title: string; field: string; }[] = [];

  fields.forEach((element: MetaDataColumn) => {
    columnBuilder.push({
      title: `${element.columnName}`,
      field: element.columnName,
    });
  });

  return columnBuilder;
}
