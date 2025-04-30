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

// TODO This widget is really now obsolete; we could use the Counts widget

const ORG_FIELD_NAME = 'Owner_group';

const columns = [
  {
    field: 'value',
    header: 'Owner organisation',
    body: (rowData: any) => rowData.value.split('-Owner'),
  },
  {
    field: 'count',
    header: 'Sample Count',
  },
];

export default function Organisations(props: ProjectWidgetProps) {
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
        data.fieldLoadingStates[ORG_FIELD_NAME] === LoadingState.SUCCESS)) {
      const counts = aggregateArrayObjects(ORG_FIELD_NAME, filteredData!) as CountRow[];
      counts.sort((a, b) => b.count - a.count);
      setAggregatedCounts(counts);
    }
  }, [filteredData, data?.loadingState, data?.fieldLoadingStates]);
  
  useEffect(() => {
    if (data?.fields && !data.fields.map(fld => fld.columnName).includes(ORG_FIELD_NAME)) {
      setErrorMessage(`Field ${ORG_FIELD_NAME} not found in project`);
    } else if (data?.loadingState === MetadataLoadingState.ERROR) {
      setErrorMessage(data.errorMessage);
    } else if (data?.fieldLoadingStates[ORG_FIELD_NAME] === LoadingState.ERROR) {
      setErrorMessage(`Error loading ${ORG_FIELD_NAME} values`);
    }
  }, [data]);
  
  const rowClickHandler = (row: DataTableRowClickEvent) => {
    const selectedRow = row.data;
    const drillDownTableMetaFilters: DataTableFilterMeta = {
      [ORG_FIELD_NAME]: {
        operator: FilterOperator.AND,
        constraints: [
          {
            matchMode: FilterMatchMode.EQUALS,
            value: selectedRow.Owner_group,
          },
        ],
      },
    };

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
        Owner organisations
      </Typography>
      { data?.fieldLoadingStates[ORG_FIELD_NAME] === LoadingState.SUCCESS && (
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
        data?.fieldLoadingStates[ORG_FIELD_NAME] === LoadingState.LOADING ||
        data?.fieldLoadingStates[ORG_FIELD_NAME] === LoadingState.IDLE) && (
        <div>Loading...</div>
      )}
    </Box>
  );
}
