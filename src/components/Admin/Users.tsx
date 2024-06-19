import React, { useEffect, useState } from 'react';
import { Alert, Box, FormControlLabel, Paper, Switch, Typography } from '@mui/material';
import { Column } from 'primereact/column';
import { DataTableRowClickEvent, DataTable, DataTableFilterMetaData, DataTableFilterMeta } from 'primereact/datatable';
import { FilterMatchMode } from 'primereact/api';
import { useNavigate } from 'react-router-dom';
import LoadingState from '../../constants/loadingState';
import { ResponseType } from '../../constants/responseType';
import { ResponseObject } from '../../types/responseObject.interface';
import sortIcon from '../TableComponents/SortIcon';
import { useApi } from '../../app/ApiContext';
import { UserList } from '../../types/dtos';
import { getUserList } from '../../utilities/resourceUtils';
import SearchInput from '../TableComponents/SearchInput';
import { UserSliceState, selectUserState } from '../../app/userSlice';
import { useAppSelector } from '../../app/store';
import ExportTableData from '../Common/ExportTableData';
import renderIcon from './UserIconRenderer';
import { PermissionLevel, hasPermission } from '../../permissions/accessTable';

function renderDisplayName(rowData: UserList) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {renderIcon(rowData)}
      {rowData.name}
    </div>
  );
}

function Users() {
  const [includeAll, setIncludeAll] = useState<boolean>(false);
  const [users, setUsers] = useState<UserList[]>([]);
  const [isUserLoadError, setIsUserLoadError] = useState<boolean>(false);
  const [isUserLoadErrorMessage, setIsUserLoadErrorMessage] = useState<string>('');
  const { token, tokenLoading } = useApi();
  const navigate = useNavigate();
  const [exportData, setExportData] = useState<UserList[]>([]);
  const [globalFilter, setGlobalFilter] = useState<DataTableFilterMeta>({
    global: { value: '', matchMode: FilterMatchMode.CONTAINS },
  });
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const user: UserSliceState = useAppSelector(selectUserState);

  const emailBodyTemplate = (rowData: UserList) => (
    (!rowData.contactEmail || rowData.contactEmail === '' || rowData.contactEmail === undefined) ?
      <Typography>~Not Filled~</Typography> : (
        <Typography>
          {rowData.contactEmail}
        </Typography>
      )
  );

  const columns = [
    {
      field: 'name',
      header: 'Name',
      body: (rowData: any) => renderDisplayName(rowData),
    },
    { field: 'contactEmail',
      header: 'Email',
      body: emailBodyTemplate },
    { field: 'organisation', header: 'Organisation' },
  ];

  useEffect(() => {
    const getUsers = async () => {
      const getUsersResponse: ResponseObject = await getUserList(includeAll, token);
      if (getUsersResponse.status === ResponseType.Success) {
        setUsers(getUsersResponse.data as UserList[]);
        setExportData(getUsersResponse.data as UserList[]);
      } else {
        setIsUserLoadError(true);
        setIsUserLoadErrorMessage(getUsersResponse.message);
      }
      setDataLoading(false);
    };

    if (tokenLoading !== LoadingState.LOADING && tokenLoading !== LoadingState.IDLE) {
      setDataLoading(true);
      getUsers();
    }
  }, [includeAll, token, tokenLoading]);

  const rowClickHandler = (selectedRow: DataTableRowClickEvent) => {
    const { id } = selectedRow.data;
    const url = `/users/${id}`;
    navigate(url);
  };

  const header = (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
        <SearchInput
          value={(globalFilter.global as DataTableFilterMetaData).value || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const { value } = e.target;
            const filters = { ...globalFilter };
            (filters.global as DataTableFilterMetaData).value = value;
            setGlobalFilter(filters);
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
          <FormControlLabel
            control={(
              <Switch
                color="primary"
                size="small"
                checked={includeAll}
                onChange={() => setIncludeAll((prev) => !prev)}
              />
          )}
            label={<Typography variant="subtitle2">Show Disabled</Typography>}
          />
          <ExportTableData
            dataToExport={exportData}
            disabled={false}
            headers={columns.map((col) => ({ label: col.header, key: col.field }))}
          />
        </div>
      </div>
    </div>
  );

  // need a ternary that opens a alert if the user is not allow here
  return (
    !hasPermission(user, 'AusTrakka-Owner', 'users', PermissionLevel.CanShow) ? (
      <Alert severity="error">
        Admin Only Page: Unauthorized
      </Alert>
    ) : (
      <>
        <Box>
          <Typography className="pageTitle" color="primary">
            Users
          </Typography>
        </Box>

        {isUserLoadError ? (
          <Alert severity="error">{isUserLoadErrorMessage}</Alert>
        ) : (
          <Paper elevation={2} sx={{ marginBottom: 10 }}>
            <DataTable
              value={users}
              size="small"
              columnResizeMode="expand"
              resizableColumns
              onValueChange={(e) => setExportData(e)}
              showGridlines
              reorderableColumns
              removableSort
              header={header}
              scrollable
              scrollHeight="calc(100vh - 300px)"
              sortIcon={sortIcon}
              paginator
              onRowClick={rowClickHandler}
              rows={25}
              loading={dataLoading}
              rowsPerPageOptions={[25, 50, 100, 150]}
              paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink JumpToPageDropDown"
              currentPageReportTemplate=" Viewing: {first} to {last} of {totalRecords}"
              paginatorPosition="bottom"
              paginatorRight
              selectionMode="single"
              editMode="cell"
              filters={globalFilter}
              globalFilterFields={columns.map((col) => col.field)}
            >
              {columns.map((col: any) => (
                <Column
                  key={col.field}
                  field={col.field}
                  header={col.header}
                  body={col.body}
                  editor={col.editor}
                  sortable={col.field !== 'contactEmail'}
                  resizeable
                  headerClassName="custom-title"
                />
              ))}
            </DataTable>
          </Paper>
        )}
      </>
    )
  );
}

export default Users;
