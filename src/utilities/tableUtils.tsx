import React from 'react';
import { Field, PrimeReactField, ProjectViewField } from '../types/dtos';
import { fieldRenderFunctions, typeRenderFunctions } from './renderUtils';

export const compareFields = (field1: Field, field2: Field) =>
  field1.columnOrder - field2.columnOrder;

export interface ColumnBuilder {
  field: string;
  header: string;
  dataType?: string;
  hidden?: boolean;
  body?: (rowData: any) => React.ReactNode;
  isDecorated?: boolean;
}

export function buildPrimeReactColumnDefinitions(fields: PrimeReactField[]): ColumnBuilder[] {
  const columnBuilders: ColumnBuilder[] = [];

  const assign = (original: any, newPart: any): any => ({ ...original, ...newPart });

  fields.forEach((field: PrimeReactField) => {
    let c = {
      field: field.columnName,
      header: field.columnDisplayName || field.columnName,
      isDecorated: false,
    };

    if (field.columnName in fieldRenderFunctions) {
      const body = { body: (rowData: any) => fieldRenderFunctions[field.columnName](rowData[field.columnName]) };
      c = assign(c, body);
    } else if (field.primitiveType && field.primitiveType in typeRenderFunctions) {
      const body = { body: (rowData: any) => typeRenderFunctions[field.primitiveType!](rowData[field.columnName]) };
      c = assign(c, body);
    }
    columnBuilders.push(c);
  });
  return columnBuilders;
}

export function buildPrimeReactColumnDefinitionsPVF(fields: ProjectViewField[]) {
  const columnBuilder: {
    field: string,
    header: string,
    dataType?: string,
    hidden?: boolean,
    body?: (rowData: any) => React.ReactNode,
  }[] = [];

  fields.forEach((field: ProjectViewField) => {
    if (field.columnName in fieldRenderFunctions) {
      columnBuilder.push({
        field: field.columnName,
        header: field.columnName,
        hidden: field.hidden,
        body: (rowData: any) => fieldRenderFunctions[field.columnName](rowData[field.columnName]),
      });
    } else if (field.primitiveType && field.primitiveType in typeRenderFunctions) {
      columnBuilder.push({
        field: field.columnName,
        header: field.columnName,
        hidden: field.hidden,
        body: (rowData: any) =>
          typeRenderFunctions[field.primitiveType!](rowData[field.columnName]),
      });
    } else {
      columnBuilder.push({
        field: field.columnName,
        header: `${field.columnName}`,
        hidden: field.hidden,
      });
    }
  });
  return columnBuilder;
}
