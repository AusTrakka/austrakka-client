import { Alert, Paper, Typography } from '@mui/material';
import { Column } from 'primereact/column';
import { DataTable, type DataTableRowClickEvent } from 'primereact/datatable';
import React, { useEffect, useState } from 'react';
import { useApi } from '../../app/ApiContext';
import LoadingState from '../../constants/loadingState';
import { ResponseType } from '../../constants/responseType';
import type { Organisation } from '../../types/dtos';
import type { ResponseObject } from '../../types/responseObject.interface';
import { getOrganisations } from '../../utilities/resourceUtils';
import sortIcon from '../TableComponents/SortIcon';
import { useNavigate } from 'react-router-dom';

const columns = [
  { field: 'abbreviation', header: 'Abbreviation' },
  { field: 'name', header: 'Name' },
  { field: 'country', header: 'Country' },
  { field: 'state', header: 'State' },
];

function OrganisationsList() {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { token, tokenLoading } = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrganisations = async () => {
      const orgRes: ResponseObject<Organisation[]> = await getOrganisations(true, token);
      if (orgRes.status === ResponseType.Success) {
        setOrganisations(orgRes.data ?? []);
        setIsLoading(false);
        setIsError(false);
      } else {
        setIsError(true);
        setIsLoading(false);
        setOrganisations([]);
        setErrorMessage(orgRes.message);
      }
    };
    if (tokenLoading !== LoadingState.IDLE && tokenLoading !== LoadingState.LOADING) {
      fetchOrganisations().catch(console.error);
    }
  });

  const rowClickHandler = (row: DataTableRowClickEvent) => {
    const abbrev: string = row.data['abbreviation'];
    navigate(`/organisations/${abbrev}`)
  };

  // const header = (
  //
  // )

  return isError ? (
    <Alert severity="error">{errorMessage}</Alert>
  ) : (
    <>
      <Typography className="pageTitle">Organisations</Typography>
      <Paper elevation={2} sx={{ marginBottom: 10 }}>
        <DataTable
          value={organisations}
          className="my-flexible-table"
          resizableColumns
          reorderableColumns
          sortIcon={sortIcon}
          sortField="abbreviation" // Initial sort order
          sortOrder={1}
          // filters={filters}
          // globalFilterFields={columns.map((col) => col.field)}
          size="small"
          removableSort
          scrollable
          rows={25}
          scrollHeight="calc(100vh - 300px)"
          onRowClick={rowClickHandler}
          selectionMode="single"
          // paginator
          // paginatorRight
          showGridlines
          // header={header}
          loading={isLoading}
          // rowsPerPageOptions={[25, 50, 100, 500]}
          // paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink JumpToPageDropDown"
          // currentPageReportTemplate=" Viewing: {first} to {last} of {totalRecords}"
        >
          {columns.map((col: any) => (
            <Column
              key={col.field}
              field={col.field}
              header={col.header}
              body={col.body}
              sortable
              className="flexible-column"
              headerClassName="custom-title"
              bodyClassName="value-cells"
            />
          ))}
        </DataTable>
      </Paper>
    </>
  );
}

export default OrganisationsList;