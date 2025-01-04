import React from 'react';
import { Field, ProjectViewField, PrimeReactField } from '../types/dtos';
import { fieldRenderFunctions, typeRenderFunctions } from './renderUtils';

export const compareFields = (field1: Field, field2: Field) =>
  field1.columnOrder - field2.columnOrder;

export function buildPrimeReactColumnDefinitions(fields: PrimeReactField[]) {
  const columnBuilder: {
    field: string,
    header: string,
    dataType?: string,
    hidden?: boolean,
    body?: (rowData: any) => React.ReactNode, }[] = [];

  const merge = (original: any, newPart: any) : any => {
    return Object.assign({}, original, newPart);
  }
  
  fields.forEach((field: PrimeReactField) => {
    let c = {
      field: field.columnName,
      header: field.columnDisplayName || field.columnName,
    };
    
    if (field.columnName in fieldRenderFunctions) {
      c = merge(c, { body: (rowData: any) => 
            fieldRenderFunctions[field.columnName](rowData[field.columnName]) });
    } 
    else if (field.primitiveType && field.primitiveType in typeRenderFunctions) {
      c = merge(c, { body: (rowData: any) => 
            typeRenderFunctions[field.primitiveType!](rowData[field.columnName]) });
    }
    columnBuilder.push(c);
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
