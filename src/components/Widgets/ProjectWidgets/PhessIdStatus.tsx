import React, { useEffect, useState } from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import { DataTable, DataTableFilterMeta, DataTableRowClickEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../app/store';
import LoadingState from '../../../constants/loadingState';
import { updateTabUrlWithSearch } from '../../../utilities/navigationUtils';
import MetadataLoadingState from '../../../constants/metadataLoadingState';
import { countPresentOrMissing } from '../../../utilities/dataProcessingUtils';
import { ProjectMetadataState, selectProjectMetadata } from '../../../app/projectMetadataSlice';
import ProjectWidgetProps from '../../../types/projectwidget.props';

const PHESS_ID_FIELD_NAME = 'PHESS_ID';

interface CountRow {
  status: string;
  sampleCount: number;
}

const columns = [
  { field: 'status', header: 'Status' },
  { field: 'sampleCount', header: 'Sample Count' },
];

export default function PhessIdStatus(props: ProjectWidgetProps) {
  const {
    projectAbbrev, filteredData, timeFilterObject,
  } = props;
  const data: ProjectMetadataState | null =
    useAppSelector(state => selectProjectMetadata(state, projectAbbrev));
  const [aggregatedCounts, setAggregatedCounts] = useState<CountRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (data?.loadingState === MetadataLoadingState.DATA_LOADED ||
      (data?.loadingState === MetadataLoadingState.PARTIAL_DATA_LOADED &&
        data.fieldLoadingStates[PHESS_ID_FIELD_NAME] === LoadingState.SUCCESS)) {
      // count Present if there is a PHESS_ID value and Missing if null/empty
      // TODO is this going to be recalculated on multiple view loads?
      const counts = countPresentOrMissing(PHESS_ID_FIELD_NAME, filteredData!) as CountRow[];
      setAggregatedCounts(counts);
    }
  }, [data?.loadingState, data?.fieldLoadingStates, filteredData]);

  useEffect(() => {
    if (data?.fields && !data.fields.map(fld => fld.columnName).includes(PHESS_ID_FIELD_NAME)) {
      setErrorMessage(`Field ${PHESS_ID_FIELD_NAME} not found in project`);
    } else if (data?.loadingState === MetadataLoadingState.ERROR) {
      setErrorMessage(data.errorMessage);
    } else if (data?.fieldLoadingStates[PHESS_ID_FIELD_NAME] === LoadingState.ERROR) {
      setErrorMessage(`Error loading ${PHESS_ID_FIELD_NAME} values`);
    }
  }, [data]);
  
  const rowClickHandler = (row: DataTableRowClickEvent) => {
    const selectedRow = row.data;
    const drillDownFilter: DataTableFilterMeta = {
      PHESS_ID: {
        operator: FilterOperator.AND,
        constraints: [
          {
            matchMode: FilterMatchMode.CUSTOM,
            value: selectedRow.status === 'Missing',
          },
        ],
      },
    };
    // Append timeFilterObject for last_week and last_month filters
    if (timeFilterObject && Object.keys(timeFilterObject).length !== 0) {
      const appendedFilters : DataTableFilterMeta = {
        ...drillDownFilter,
        ...timeFilterObject,
      };
      updateTabUrlWithSearch(navigate, '/samples', appendedFilters);
    } else {
      updateTabUrlWithSearch(
        navigate,
        '/samples',
        drillDownFilter,
      );
    }
  };

  return (
    <Box>
      <Typography variant="h5" paddingBottom={3} color="primary">
        PHESS ID Status
      </Typography>
      { data?.fieldLoadingStates[PHESS_ID_FIELD_NAME] === LoadingState.SUCCESS && (
      <DataTable
        value={aggregatedCounts}
        size="small"
        onRowClick={rowClickHandler}
        selectionMode="single"
      >
        {columns.map((col: any) => (
          <Column
            key={col.field}
            field={col.field}
            header={col.header}
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
        data?.fieldLoadingStates[PHESS_ID_FIELD_NAME] === LoadingState.LOADING ||
        data?.fieldLoadingStates[PHESS_ID_FIELD_NAME] === LoadingState.IDLE) && (
        <div>Loading...</div>
      )}
    </Box>
  );
}
