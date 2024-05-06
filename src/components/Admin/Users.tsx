import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, Paper, Switch, TextField, Typography } from '@mui/material';
import { Column, ColumnEditorOptions, ColumnEvent } from 'primereact/column';
import { DataTableRowClickEvent, DataTable, DataTableFilterMetaData, DataTableFilterMeta } from 'primereact/datatable';
import { FilterMatchMode } from 'primereact/api';
import { Close, Done, ModeEdit } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import LoadingState from '../../constants/loadingState';
import { ResponseType } from '../../constants/responseType';
import { ResponseObject } from '../../types/responseObject.interface';
import sortIcon from '../TableComponents/SortIcon';
import { useApi } from '../../app/ApiContext';
import { User } from '../../types/dtos';
import { getAllUsers, patchUserContactEmail } from '../../utilities/resourceUtils';
import SearchInput from '../TableComponents/SearchInput';
import { UserSliceState, selectUserState } from '../../app/userSlice';
import { useAppSelector } from '../../app/store';
import ExportTableData from '../Common/ExportTableData';
import renderIcon from './UserIconRenderer';
import { PermissionLevel, hasPermission } from '../../permissions/accessTable';

function renderDisplayName(rowData: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {renderIcon(rowData)}
      {rowData.displayName}
    </div>
  );
}

function Users() {
  const [includeAll, setIncludeAll] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isUserLoadError, setIsUserLoadError] = useState<boolean>(false);
  const [isUserLoadErrorMessage, setIsUserLoadErrorMessage] = useState<string>('');
  const { token, tokenLoading } = useApi();
  const [editingRows, setEditingRows] = useState<any>(false);
  const [confirmationDialog, setConfirmationDialog] = useState<boolean>(false);
  const [currentRowData, setCurrentRowData] = useState<any>(null);
  const navigate = useNavigate();
  const [exportData, setExportData] = useState<User[]>([]);
  const [globalFilter, setGlobalFilter] = useState<DataTableFilterMeta>({
    global: { value: '', matchMode: FilterMatchMode.CONTAINS },
  });
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const user: UserSliceState = useAppSelector(selectUserState);

  const onCellEditInit = (event: any) => {
    if (event.field === 'contactEmail') {
      setEditingRows(event.data);
      setCurrentRowData(event.data);
    }
  };

  const emailEditor = (options: ColumnEditorOptions) => {
    const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        return;
      }

      e.stopPropagation();
    };

    return (
      <TextField
        type="text"
        size="small"
        variant="standard"
        color="secondary"
        value={options.value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          options.editorCallback && options.editorCallback(e.target.value)}
        onKeyDown={handleKeyUp}
        // onBlur should not override the onKeyUp events e.g. Enter and Escape
      />
    );
  };
  const onCellEditComplete = (e: ColumnEvent) => {
    const { rowData, newValue, field, originalEvent: event } = e;
    if (field === 'contactEmail') {
      if (newValue === rowData.contactEmail || newValue === undefined || newValue === null) {
        event.preventDefault();
        return;
      }
      const copy = { ...rowData, [field]: newValue };
      setCurrentRowData(copy);
      setConfirmationDialog(true);
    }
  };

  const patchUserEmail = async (userObjectId: string, newEmail: string) => {
    const response: ResponseObject =
    await patchUserContactEmail(userObjectId, token, newEmail);
    if (response.status !== ResponseType.Success) {
      throw new Error(response.message);
    } else {
      setUsers(users.map((user) => {
        if (user.objectId === userObjectId) {
          return {
            ...user,
            contactEmail: newEmail,
          };
        }
        return user;
      }));
    }
  };

  const confirmEmailChange = () => {
    const userObjectId = currentRowData.objectId;
    const newEmail = currentRowData.contactEmail;

    patchUserEmail(userObjectId, newEmail);
    setConfirmationDialog(false);
    setCurrentRowData(null);
  };

  const cancelEmailChange = () => {
    setConfirmationDialog(false);
    setEditingRows({});
  };
  const emailBodyTemplate = (rowData: any) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span>{(!rowData.contactEmail || rowData.contactEmail === '' || rowData.contactEmail === undefined) ? '~Not Filled~' : rowData.contactEmail}</span>
      <ModeEdit fontSize="small" color="disabled" />
    </div>
  );

  const columns = [
    {
      field: 'displayName',
      header: 'Name',
      body: (rowData: any) => renderDisplayName(rowData),
    },
    { field: 'contactEmail',
      header: 'Email',
      editor: (options: ColumnEditorOptions) => emailEditor(options),
      body: emailBodyTemplate },
    { field: 'orgAbbrev', header: 'Organisation' },
  ];

  useEffect(() => {
    const getUsers = async () => {
      const getUsersResponse: ResponseObject = await getAllUsers(includeAll, token);
      if (getUsersResponse.status === ResponseType.Success) {
        setUsers(getUsersResponse.data as User[]);
        setExportData(getUsersResponse.data as User[]);
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

  const rowClickHandler = (row: DataTableRowClickEvent) => {
    // will not need to do this once the email edit is gone from the main page
    if ((row.originalEvent.target as HTMLElement)?.closest('td')?.className === 'p-editable-column') return;

    // wont need to this if else stuff once the email edit is gone from the main page
    const selectedRow = row; // Assuming "original" contains the row data
    // Check if the "Object Id" property exists in the selected row
    if ('objectId' in selectedRow.data) {
      const { objectId } = selectedRow.data; // Replace "objectId" with the actual property name
      const url = `/users/${objectId}`;
      navigate(url);
    } else {
      // eslint-disable-next-line no-console
      console.error('Object Id not found in selectedRow.');
    }
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
          <>
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
                editingRows={editingRows}
                filters={globalFilter}
                globalFilterFields={['displayName', 'organisation.abbreviation', 'contactEmail']}
              >
                {columns.map((col: any) => (
                  <Column
                    key={col.field}
                    field={col.field}
                    header={col.header}
                    body={col.body}
                    editor={col.editor}
                    onCellEditInit={col.field === 'contactEmail' ? onCellEditInit : undefined}
                    onCellEditComplete={col.field === 'contactEmail' ? onCellEditComplete : undefined}
                    sortable={col.field !== 'contactEmail'}
                    resizeable
                    headerClassName="custom-title"
                  />
                ))}
              </DataTable>
            </Paper>
            <Dialog
              open={confirmationDialog}
              onClose={cancelEmailChange}
              aria-labelledby="confirm-email-change-dialog-title"
            >
              <DialogTitle id="confirm-email-change-dialog-title">
                Confirm Email Change
              </DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Are you sure you want to change the email address?
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<Done />}
                  onClick={confirmEmailChange}
                >
                  Yes
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Close />}
                  onClick={cancelEmailChange}
                >
                  No
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </>
    )
  );
}

export default Users;
