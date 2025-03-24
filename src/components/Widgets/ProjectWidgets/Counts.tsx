import React, { useEffect, useState } from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import { DataTable, DataTableFilterMeta, DataTableRowClickEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../app/store';
import { updateTabUrlWithSearch } from '../../../utilities/navigationUtils';
import { ProjectMetadataState, selectProjectMetadata } from '../../../app/projectMetadataSlice';
import MetadataLoadingState from '../../../constants/metadataLoadingState';
import { CountRow, aggregateArrayObjects } from '../../../utilities/dataProcessingUtils';
import LoadingState from '../../../constants/loadingState';
import ProjectWidgetProps from '../../../types/projectwidget.props';
import { Sample } from '../../../types/sample.interface';

// Counts table for specified field

const NULL_VALUE = 'Missing';

interface CountsWidgetProps extends ProjectWidgetProps {
  projectAbbrev: string;
  filteredData: Sample[];
  timeFilterObject: DataTableFilterMeta;
  field: string;
  title: string;
  // eslint-disable-next-line react/require-default-props
  fieldTitle?: string;
}

export default function Counts(props: CountsWidgetProps) {
  const {
    projectAbbrev, filteredData, timeFilterObject, field, title,
  } = props;
  let { fieldTitle } = props;
  if (!fieldTitle) {
    fieldTitle = field;
  }
  const data: ProjectMetadataState | null =
    useAppSelector(state => selectProjectMetadata(state, projectAbbrev));
  const [aggregatedCounts, setAggregatedCounts] = useState<CountRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const columns = [
    {
      field: 'value',
      header: fieldTitle,
      body: (rowData: any) => (field === 'Owner_group' ? rowData.value.split('-Owner') : rowData.value),
    },
    {
      field: 'count',
      header: 'Sample Count',
    },
  ];
  
  useEffect(() => {
    if (data?.loadingState === MetadataLoadingState.DATA_LOADED ||
      (data?.loadingState === MetadataLoadingState.PARTIAL_DATA_LOADED &&
        data.fieldLoadingStates[field] === LoadingState.SUCCESS)) {
      const counts = aggregateArrayObjects(field, filteredData!, NULL_VALUE) as CountRow[];
      setAggregatedCounts(counts);
    }
  }, [field, filteredData, data?.loadingState, data?.fieldLoadingStates]);
  
  useEffect(() => {
    if (data?.fields && !data.fields.map(fld => fld.columnName).includes(field)) {
      setErrorMessage(`Field ${field} not found in project`);
    } else if (data?.loadingState === MetadataLoadingState.ERROR) {
      setErrorMessage(data.errorMessage);
    } else if (data?.fieldLoadingStates[field] === LoadingState.ERROR) {
      setErrorMessage(`Error loading ${field} values`);
    }
  }, [data, field]);
  
  const rowClickHandler = (row: DataTableRowClickEvent) => {
    const selectedRow = row.data;
    let drillDownTableMetaFilters: DataTableFilterMeta = {};
    
    if (selectedRow.value === NULL_VALUE) {
      // Find empty values
      drillDownTableMetaFilters = {
        [field]: {
          operator: FilterOperator.AND,
          constraints: [
            {
              matchMode: FilterMatchMode.CUSTOM,
              value: true,
            },
          ],
        },
      };
    } else {
      // Not null, so match metadata value
      drillDownTableMetaFilters = {
        [field]: {
          operator: FilterOperator.AND,
          constraints: [
            {
              matchMode: FilterMatchMode.EQUALS,
              value: selectedRow.value,
            },
          ],
        },
      };
    }

    if (timeFilterObject && Object.keys(timeFilterObject).length !== 0) {
      const combinedFilters: DataTableFilterMeta = {
        ...drillDownTableMetaFilters,
        ...timeFilterObject,
      };
      updateTabUrlWithSearch(navigate, '/samples', combinedFilters);
    } else {
      updateTabUrlWithSearch(navigate, '/samples', drillDownTableMetaFilters);
    }
  };
  
  return (
    <Box>
      <Typography variant="h5" paddingBottom={3} color="primary">
        {title}
      </Typography>
      { data?.fieldLoadingStates[field] === LoadingState.SUCCESS && (
      <DataTable
        value={aggregatedCounts}
        size="small"
        onRowClick={rowClickHandler}
        selectionMode="single"
        scrollable
        scrollHeight="800px"
      >
        {columns.map((col: any) => (
          <Column
            key={col.field}
            field={col.field}
            header={col.header}
            body={col.body}
          />
        ))}
      </DataTable>
      )}
      {errorMessage && (
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        {errorMessage}
      </Alert>
      )}
      {(!(data?.fieldLoadingStates) ||
        data?.fieldLoadingStates[field] === LoadingState.LOADING ||
        data?.fieldLoadingStates[field] === LoadingState.IDLE) && (
        <div>Loading...</div>
      )}
    </Box>
  );
}
