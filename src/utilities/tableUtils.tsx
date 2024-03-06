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
