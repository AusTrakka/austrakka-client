import React from 'react';
import { PrimeReactField, ProjectViewField } from '../types/dtos';
import { fieldRenderFunctions, typeRenderFunctions } from './renderUtils';

export type PrimeReactColumnDefinition = {
  field: string,
  header: string,
  dataType?: string,
  hidden?: boolean,
  body?: (rowData: any) => React.ReactNode,
  isDecorated?: boolean;
};

export function buildPrimeReactColumnDefinitions(fields: PrimeReactField[]):
PrimeReactColumnDefinition[] {
  const columnBuilders: PrimeReactColumnDefinition[] = [];

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
  const columnBuilder: PrimeReactColumnDefinition[] = [];

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
