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
import { getUserListV2 } from '../../utilities/resourceUtils';
import SearchInput from '../TableComponents/SearchInput';
import { UserSliceState, selectUserState } from '../../app/userSlice';
import { useAppSelector } from '../../app/store';
import ExportTableData from '../Common/ExportTableData';
import renderIcon from './UserIconRenderer';
import { PermissionLevel, hasPermission } from '../../permissions/accessTable';
import { selectTenantState, TenantSliceState } from '../../app/tenantSlice';
import { isoDateLocalDate } from '../../utilities/dateUtils';

function renderDisplayName(rowData: UserList) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {renderIcon(rowData)}
      {rowData.name}
    </div>
  );
}

function UsersV2() {
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
  const tenant: TenantSliceState = useAppSelector(selectTenantState);

  const emailBodyTemplate = (rowData: UserList) => (
    (!rowData.contactEmail || rowData.contactEmail === '' || rowData.contactEmail === undefined) ?
      '~Not Filled~' :
      rowData.contactEmail
      
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
    { field: 'analysisServerUsername', header: 'Analysis Server Username' },
    { field: 'lastLogIn', header: 'Last Log In', body: (rowData: any) => isoDateLocalDate(rowData.lastLogIn) },
    { field: 'lastActive', header: 'Last Active', body: (rowData: any) => isoDateLocalDate(rowData.lastActive) },
  ];

  useEffect(() => {
    const getUsers = async () => {
      const getUsersResponse: ResponseObject = await getUserListV2(
        includeAll,
        tenant.defaultTenantGlobalId,
        token,
      );
      if (getUsersResponse.status === ResponseType.Success) {
        setUsers(getUsersResponse.data as UserList[]);
        setExportData(getUsersResponse.data as UserList[]);
      } else {
        setIsUserLoadError(true);
        setIsUserLoadErrorMessage(getUsersResponse.message);
      }
      setDataLoading(false);
    };

    if (tokenLoading !== LoadingState.LOADING &&
        tokenLoading !== LoadingState.IDLE &&
        tenant.loading === LoadingState.SUCCESS) {
      setDataLoading(true);
      getUsers();
    }
  }, [includeAll, token, tokenLoading, tenant]);

  const rowClickHandler = (selectedRow: DataTableRowClickEvent) => {
    const { globalId } = selectedRow.data;
    const url = `/usersV2/${globalId}`;
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
            headers={columns.map((col) => (col.field))}
          />
        </div>
      </div>
    </div>
  );

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
              className="my-flexible-table"
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
                  className="flexible-column"
                  bodyClassName="value-cells"
                />
              ))}
            </DataTable>
          </Paper>
        )}
      </>
    )
  );
}

export default UsersV2;
