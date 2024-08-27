import React, { useEffect } from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import { DataTable, DataTableFilterMeta, DataTableRowClickEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { useAppDispatch, useAppSelector } from '../../../app/store';
import { fetchOrganisations, selectAggregatedOrgs } from './organisationsSlice';
import LoadingState from '../../../constants/loadingState';
import { useApi } from '../../../app/ApiContext';
import { updateTabUrlWithSearch } from '../../../utilities/navigationUtils';

const submittingOrgFieldName = 'Owner_group';

const columns = [
  { field: 'Owner_group', header: 'Owner organisation', body: (rowData: any) => rowData.Owner_group.split('-Owner') },
  { field: 'sampleCount', header: 'Sample Count' },
];

export default function Organisations(props: any) {
  const {
    projectId,
    groupId,
  } = props;
  // Get initial state from store
  const { loading, data } = useAppSelector((state) => state.organisationsState);
  const { timeFilter, timeFilterObject } = useAppSelector((state) => state.projectDashboardState);
  const organisationsDispatch = useAppDispatch();
  const aggregatedCounts = useAppSelector(selectAggregatedOrgs);
  const { token, tokenLoading } = useApi();
  // const navigate = useNavigate();

  useEffect(() => {
    const dispatchProps = { groupId, token, projectId, timeFilter };
    if (loading === 'idle' &&
      tokenLoading !== LoadingState.IDLE &&
      tokenLoading !== LoadingState.LOADING
    ) {
      organisationsDispatch(fetchOrganisations(dispatchProps));
    }
  }, [loading, organisationsDispatch, timeFilter,
    projectId, groupId, token, tokenLoading]);

  const rowClickHandler = (row: DataTableRowClickEvent) => {
    const selectedRow = row.data;
    const drillDownTableMetaFilters: DataTableFilterMeta = {
      [submittingOrgFieldName]: {
        operator: FilterOperator.AND,
        constraints: [
          {
            matchMode: FilterMatchMode.EQUALS,
            value: selectedRow.Owner_group,
          },
        ],
      },
    };

    if (Object.keys(timeFilterObject).length !== 0) {
      const combinedFilters: DataTableFilterMeta = {
        ...drillDownTableMetaFilters,
        ...timeFilterObject,
      };
      updateTabUrlWithSearch('/samples', combinedFilters);
    } else {
      updateTabUrlWithSearch('/samples', drillDownTableMetaFilters);
    }
  };

  return (
    <Box>
      <Typography variant="h5" paddingBottom={3} color="primary">
        Owner organisations
      </Typography>
      { loading === LoadingState.SUCCESS && (
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
      { loading === LoadingState.ERROR && (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {data.message}
        </Alert>
      )}
      { loading === LoadingState.LOADING && (
        <div>Loading...</div>
      )}
    </Box>
  );
}
