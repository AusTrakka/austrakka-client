/* eslint-disable no-param-reassign */
import React from 'react';
import { MRT_ColumnDef } from 'material-react-table';
import { Skeleton } from '@mui/material';
import { Field } from '../types/dtos';
import { fieldRenderFunctions, typeRenderFunctions } from './helperUtils';
import { Sample } from '../types/sample.interface';
import LoadingState from '../constants/loadingState';

export const compareFields = (field1: Field, field2: Field) =>
  field1.columnOrder - field2.columnOrder;

const placeholder = <Skeleton variant="text" animation="wave" width="6em" />;

/**
 * @deprecated The method should not be used
 *
 * should be removed when this is fully removed
 */
export function buildMRTColumnDefinitions(
  fields: Field[],
  fieldLoadingStates?: Record<string, LoadingState> | null,
) {
  const columnBuilder: React.SetStateAction<MRT_ColumnDef<Sample>[]> = [];

  fields.forEach((element: Field) => {
    // if we were passed fieldLoadingStates, and state is idle/loading, render placeholder
    if (fieldLoadingStates && (
      fieldLoadingStates[element.columnName] === LoadingState.IDLE ||
      fieldLoadingStates[element.columnName] === LoadingState.LOADING)
    ) {
      columnBuilder.push({
        accessorKey: element.columnName,
        header: `${element.columnName}`,
        Cell: () => placeholder,
      });
    } else if (element.columnName in fieldRenderFunctions) {
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
