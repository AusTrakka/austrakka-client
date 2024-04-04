import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Paper, Typography } from '@mui/material';
import { DataTable, DataTableFilterMeta, DataTableFilterMetaData, DataTableRowClickEvent } from 'primereact/datatable';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import { isoDateLocalDate } from '../../utilities/helperUtils';
import { getProjectList } from '../../utilities/resourceUtils';
import { useApi } from '../../app/ApiContext';
import LoadingState from '../../constants/loadingState';
import { ResponseObject } from '../../types/responseObject.interface';
import { ResponseType } from '../../constants/responseType';
import sortIcon from '../TableComponents/SortIcon';
import SearchInput from '../TableComponents/SearchInput';

const columns = [
  { field: 'abbreviation', header: 'Abbreviation' },
  { field: 'name', header: 'Name' },
  { field: 'description', header: 'Description' },
  { field: 'created', header: 'Created', body: (rowData: any) => isoDateLocalDate(rowData.created) },
];

function ProjectsList() {
  const [projectsList, setProjectsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedProject, setSelectedProject] = useState({});
  const navigate = useNavigate();
  const { token, tokenLoading } = useApi();
  const [globalFilter, setGlobalFilter] = useState<DataTableFilterMeta>(
    { global: { value: null, matchMode: FilterMatchMode.CONTAINS } },
  );

  useEffect(() => {
    async function getProject() {
      const projectResponse: ResponseObject = await getProjectList(token);
      if (projectResponse.status === ResponseType.Success) {
        setProjectsList(projectResponse.data);
        setIsLoading(false);
        setIsError(false);
      } else {
        setIsError(true);
        setIsLoading(false);
        setProjectsList([]);
        setErrorMessage(projectResponse.message);
      }
    }
    // NEW: Only call endpoint if token has already been retrieved/attempted to be retrieved
    // Otherwise the first endpoint call will always be unsuccessful
    if (tokenLoading !== LoadingState.IDLE && tokenLoading !== LoadingState.LOADING) {
      getProject();
    }
  }, [token, tokenLoading]);

  useEffect(() => {
    if (Object.keys(selectedProject).length !== 0) {
      const { abbreviation }: any = selectedProject;
      navigate(`/projects/${abbreviation}/summary`);
    }
  }, [selectedProject, navigate]);

  const rowClickHandler = (row: DataTableRowClickEvent) => {
    const selectedProjectRow = row.data;
    setSelectedProject(selectedProjectRow);
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const filters = { ...globalFilter };
    (filters.global as DataTableFilterMetaData).value = value;
    setGlobalFilter(filters);
  };

  const header = (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
      <SearchInput
        value={(globalFilter.global as DataTableFilterMetaData).value || ''}
        onChange={onGlobalFilterChange}
      />
    </div>
  );

  return (
    (isError) ? (
      <Alert severity="error">
        {errorMessage}
      </Alert>
    )
      : (
        <>
          <Typography className="pageTitle">
            Projects
          </Typography>
          <Paper elevation={2} sx={{ marginBottom: 10 }}>
            <DataTable
              value={projectsList}
              columnResizeMode="expand"
              resizableColumns
              reorderableColumns
              sortIcon={sortIcon}
              filters={globalFilter}
              globalFilterFields={columns.map((col) => col.field)}
              size="small"
              removableSort
              scrollable
              rows={25}
              scrollHeight="calc(100vh - 300px)"
              onRowClick={rowClickHandler}
              selectionMode="single"
              paginator
              paginatorRight
              showGridlines
              header={header}
              loading={isLoading}
              rowsPerPageOptions={[25, 50, 100, 500]}
              paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink JumpToPageDropDown"
              currentPageReportTemplate=" Viewing: {first} to {last} of {totalRecords}"
            >
              {columns.map((col: any) => (
                <Column
                  key={col.field}
                  field={col.field}
                  header={col.header}
                  body={col.body}
                  sortable
                  resizeable
                  headerClassName="custom-title"
                  style={{ minWidth: '150px' }}
                />
              ))}
            </DataTable>
          </Paper>
        </>
      )
  );
}
export default ProjectsList;
