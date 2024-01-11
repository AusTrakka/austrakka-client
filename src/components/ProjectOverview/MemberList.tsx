/* eslint-disable react/jsx-pascal-case */
import React, { memo, useEffect, useRef, useState } from 'react';
import MaterialReactTable, { MRT_ColumnDef, MRT_ShowHideColumnsButton, MRT_ToggleFiltersButton } from 'material-react-table';
import { Alert, AlertTitle, Box, Chip, CircularProgress, Dialog, IconButton, Tooltip } from '@mui/material';
import { Close, FileDownload } from '@mui/icons-material';
import { CSVLink } from 'react-csv';
import { useNavigate } from 'react-router-dom';
import isoDateLocalDate from '../../utilities/helperUtils';
import LoadingState from '../../constants/loadingState';
import { Member, Project } from '../../types/dtos';
import { useApi } from '../../app/ApiContext';
import { ResponseObject } from '../../types/responseObject.interface';
import { getGroupMembers } from '../../utilities/resourceUtils';
import { ResponseType } from '../../constants/responseType';

interface MembersProps {
  projectDetails: Project | null
  isMembersLoading: boolean,
  setIsMembersLoading: React.Dispatch<React.SetStateAction<boolean>>,
}

function renderList(cell : any): JSX.Element[] {
  const roles = cell.getValue();
  if (Array.isArray(roles)) {
    return roles.map((r) => (
      <Chip key={r} label={r} color="primary" variant="outlined" style={{ margin: '3px' }} />
    ));
  }

  return [<Chip key={roles} label={roles} />];
}

const memberTableColumns: MRT_ColumnDef[] = [
  { accessorKey: 'displayName', header: 'Name' },
  { accessorKey: 'organization.abbreviation', header: 'Organisations' },
  { accessorKey: 'roles', header: 'Roles', Cell: ({ cell }: any) => <>{renderList(cell)}</> },
  { accessorKey: 'lastLoggedIn', header: 'Last Logged In', Cell: ({ cell }: any) => <>{isoDateLocalDate(cell.getValue())}</> },
];

function MemberList(props: MembersProps) {
  const {
    projectDetails,
    isMembersLoading,
    setIsMembersLoading,
  } = props;

  const [exportCSVStatus, setExportCSVStatus] = useState(LoadingState.IDLE);
  const [transformedData, setTransformedData] = useState<any[]>([]);
  const [memberList, setMemberList] = useState<Member[]>([]);
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
        lastLoggedIn: member.lastLoggedIn,
      }));
      setTransformedData(td);
      setExportCSVStatus(LoadingState.SUCCESS);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error exporting data:', error);
      setExportCSVStatus(LoadingState.ERROR);
    }
  };

  const rowClickHandler = (row: any) => {
    const selectedRow = row.original; // Assuming "original" contains the row data

    // Check if the "Object Id" property exists in the selected row
    if ('objectId' in selectedRow) {
      const { objectId } = selectedRow; // Replace "objectId" with the actual property name
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
        data={transformedData}
        headers={[
          { label: 'Name', key: 'displayName' },
          { label: 'Organization', key: 'organization' },
          { label: 'Roles', key: 'roles' },
          { label: 'Last Logged In', key: 'lastLoggedIn' },
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

  if (isMembersLoading) return null;

  return (
    <>
      {isMembersLoading ? <CircularProgress /> : null}
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
      <MaterialReactTable
        columns={memberTableColumns}
        data={memberList}
        state={{
          showAlertBanner: memberListError,
        }}
        enableStickyHeader
        initialState={{ density: 'compact' }}
        enableColumnResizing
        enableFullScreenToggle={false}
        enableDensityToggle={false}
        muiTableProps={{
          sx: {
            'width': 'auto', 'tableLayout': 'auto', '& td:last-child': { width: '100%' }, '& th:last-child': { width: '100%' },
          },
        }}
        muiToolbarAlertBannerProps={
          memberListError
            ? {
              color: 'error',
              children: memberListErrorMessage,
            }
            : undefined
        }
        muiTableBodyRowProps={({ row }) => ({
          onClick: () => rowClickHandler(row),
          sx: {
            cursor: 'pointer',
          },
        })}
        renderToolbarInternalActions={({ table }) => (
          <Box>
            {ExportButton}
            <MRT_ToggleFiltersButton table={table} />
            <MRT_ShowHideColumnsButton table={table} />
          </Box>
        )}
      />
    </>
  );
}
export default memo(MemberList);
