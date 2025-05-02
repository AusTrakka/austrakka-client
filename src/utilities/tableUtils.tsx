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

  fields.forEach(({ columnName, primitiveType, columnDisplayName }: PrimeReactField) => {
    let c = {
      field: columnName,
      header: columnDisplayName || columnName,
      isDecorated: false,
    };
    
    if (columnName in fieldRenderFunctions) {
      const body = {
        body: (rowData: any) => fieldRenderFunctions[columnName](rowData[columnName]),
      };
      c = assign(c, body);
    } else if (primitiveType && primitiveType in typeRenderFunctions) {
      const body = {
        body: (rowData: any) => typeRenderFunctions[primitiveType!](rowData[columnName]),
      };
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
