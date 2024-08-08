/* eslint-disable react/jsx-pascal-case */
import React, { memo, useEffect, useRef, useState } from 'react';
import { Alert, AlertTitle, Chip, CircularProgress, Dialog, IconButton, Paper, Tooltip } from '@mui/material';
import { Close, FileDownload } from '@mui/icons-material';
import { CSVLink } from 'react-csv';
import { useNavigate } from 'react-router-dom';
import { DataTable, DataTableFilterMeta, DataTableFilterMetaData, DataTableRowClickEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FilterMatchMode } from 'primereact/api';
import LoadingState from '../../constants/loadingState';
import { Member, Project } from '../../types/dtos';
import { useApi } from '../../app/ApiContext';
import { ResponseObject } from '../../types/responseObject.interface';
import { getGroupMembers } from '../../utilities/resourceUtils';
import { ResponseType } from '../../constants/responseType';
import SearchInput from '../TableComponents/SearchInput';
import sortIcon from '../TableComponents/SortIcon';

interface MembersProps {
  projectDetails: Project | null
  isMembersLoading: boolean,
  setIsMembersLoading: React.Dispatch<React.SetStateAction<boolean>>,
}

function renderList(cell : any): JSX.Element[] {
  const roles = cell;
  if (Array.isArray(roles)) {
    return roles.map((r) => (
      <Chip key={r} label={r} variant="filled" color="secondary" size="small" style={{ margin: '3px' }} />
    ));
  }

  return [<Chip key={roles} variant="filled" color="secondary" size="small" label={roles} />];
}

function MemberList(props: MembersProps) {
  const {
    projectDetails,
    isMembersLoading,
    setIsMembersLoading,
  } = props;

  const [exportCSVStatus, setExportCSVStatus] = useState(LoadingState.IDLE);
  const [transformedData, setTransformedData] = useState<any[]>([]);
  const [exportData, setExportData] = useState<Member[]>([]);
  const [memberList, setMemberList] = useState<Member[]>([]);
  const columns = [
    { field: 'displayName', header: 'Name' },
    { field: 'contactEmail', header: 'Email', body: (rowData: any) => rowData.contactEmail ?? 'Unavailable' },
    { field: 'organization.abbreviation', header: 'Organizations', body: (rowData: any) => rowData.organization?.abbreviation },
    { field: 'roles', header: 'Roles', body: (rowData: any) => renderList(rowData.roles) },
  ];
  const [globalFilter, setGlobalFilter] = useState<DataTableFilterMeta>(
    { global: { value: null, matchMode: FilterMatchMode.CONTAINS } },
  );
  const [memberListError, setMemberListError] = useState(false);
  const [memberListErrorMessage, setMemberListErrorMessage] = useState('');
  const navigate = useNavigate();
  const { token } = useApi();

  useEffect(() => {
    async function getMemberList() {
      // eslint-disable-next-line max-len
      const memberListResponse : ResponseObject = await getGroupMembers(projectDetails!.projectMembers.id, token);
      if (memberListResponse.status === ResponseType.Success) {
        setMemberList(memberListResponse.data as Member[]);
        setMemberListError(false);
        setIsMembersLoading(false);
      } else {
        setIsMembersLoading(false);
        setMemberList([]);
        setMemberListError(true);
        setMemberListErrorMessage(memberListResponse.message);
      }
    }

    if (projectDetails) {
      getMemberList();
    }
  }, [projectDetails, setIsMembersLoading, token]);

  const generateFilename = () => {
    if (!projectDetails) return null;
    const dateObject = new Date();
    const year = dateObject.toLocaleString('default', { year: 'numeric' });
    const month = dateObject.toLocaleString('default', { month: '2-digit' });
    const day = dateObject.toLocaleString('default', { day: '2-digit' });
    return `austrakka_${projectDetails!.abbreviation}_users_export_${year}${month}${day}`;
  };

  const csvLink = useRef<CSVLink & HTMLAnchorElement & { link: HTMLAnchorElement }>(null);

  useEffect(() => {
    if (exportCSVStatus === LoadingState.SUCCESS) {
      try {
        csvLink.current?.link.click();
        setExportCSVStatus(LoadingState.IDLE);
      } catch (error) {
        setExportCSVStatus(LoadingState.ERROR);
      }
    }
  }, [exportCSVStatus]);

  const handleExportCSV = () => {
    try {
      setExportCSVStatus(LoadingState.LOADING);
      const td = memberList.map((member) => ({
        roles: member.roles,
        // eslint-disable-next-line max-len
        organization: member.organization?.abbreviation, // Assuming organization is an object with a 'name' property
        displayName: member.displayName,
      }));
      setTransformedData(td);
      setExportCSVStatus(LoadingState.SUCCESS);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error exporting data:', error);
      setExportCSVStatus(LoadingState.ERROR);
    }
  };

  const rowClickHandler = (row: DataTableRowClickEvent) => {
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

  const ExportButton = (
    <>
      <CSVLink
        data={exportData.length > 0 ? exportData : transformedData}
        headers={[
          { label: 'Name', key: 'displayName' },
          { label: 'Organizations', key: 'organization' },
          { label: 'Roles', key: 'roles' },
        ]}
        ref={csvLink}
        style={{ display: 'none' }}
        filename={generateFilename() || 'austrakka_export.csv'}
      />
      <Tooltip title="Export to CSV" placement="top" arrow>
        <IconButton
          onClick={handleExportCSV}
          disabled={exportCSVStatus === LoadingState.LOADING || memberList.length < 1}
        >
          {exportCSVStatus === LoadingState.LOADING
            ? (
              <CircularProgress
                color="secondary"
                size={40}
                sx={{
                  position: 'absolute',
                  zIndex: 1,
                }}
              />
            )
            : null}
          <FileDownload />
        </IconButton>
      </Tooltip>
    </>
  );
  const handleDialogClose = () => {
    setExportCSVStatus(LoadingState.IDLE);
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const filters = { ...globalFilter };
    (filters.global as DataTableFilterMetaData).value = value;
    setGlobalFilter(filters);
  };

  if (isMembersLoading) return null;

  const header = (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SearchInput
          value={(globalFilter.global as DataTableFilterMetaData).value || ''}
          onChange={onGlobalFilterChange}
        />
        {ExportButton}
      </div>
    </div>
  );

  return (
    <>
      {isMembersLoading ? <CircularProgress /> : null}
      {memberListError ? (
        <Alert severity="error">
          {memberListErrorMessage}
        </Alert>
      ) : (
        <>
          <Dialog onClose={handleDialogClose} open={exportCSVStatus === LoadingState.ERROR}>
            <Alert severity="error" sx={{ padding: 3 }}>
              <IconButton
                aria-label="close"
                onClick={handleDialogClose}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <Close />
              </IconButton>
              <AlertTitle sx={{ paddingBottom: 1 }}>
                <strong>Your data could not be exported to CSV.</strong>
              </AlertTitle>
              There has been an error exporting your data to CSV.
              <br />
              Please try again later, or contact an AusTrakka admin.
            </Alert>
          </Dialog>
          <Paper elevation={2} sx={{ marginBottom: 10 }}>
            <DataTable
              value={memberList}
              removableSort
              columnResizeMode="expand"
              resizableColumns
              onValueChange={(e) => setExportData(e)}
              size="small"
              scrollable
              scrollHeight="100%"
              reorderableColumns
              showGridlines
              selectionMode="single"
              onRowClick={rowClickHandler}
              header={header}
              filters={globalFilter}
              globalFilterFields={columns.map((col) => col.field)}
              sortIcon={sortIcon}
              className="my-flexible-table"
            >
              {columns.map((col: any) => (
                <Column
                  key={col.field}
                  field={col.field}
                  header={col.header}
                  body={col.body}
                  hidden={col.hidden ?? false}
                  sortable
                  resizeable
                  className="flexible-column"
                  style={{ minWidth: '150px' }}
                  headerClassName="custom-title"
                />
              ))}
            </DataTable>
          </Paper>
        </>
      )}

    </>
  );
}
export default memo(MemberList);
