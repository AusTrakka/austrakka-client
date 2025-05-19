import React from 'react';
import { Field, ProjectViewField } from '../types/dtos';
import { fieldRenderFunctions, typeRenderFunctions } from './renderUtils';

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

export function buildPrimeReactColumnDefinitionsPVF(fields: ProjectViewField[]) {
  const columnBuilder: {
    field: string,
    header: string,
    dataType?: string,
    hidden?: boolean,
    body?: (rowData: any) => React.ReactNode, }[] = [];

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
