/* eslint-disable no-param-reassign */
import React from 'react';
import { Field } from '../types/dtos';
import { fieldRenderFunctions, typeRenderFunctions } from './helperUtils';

export const compareFields = (field1: Field, field2: Field) =>
  field1.columnOrder - field2.columnOrder;

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
