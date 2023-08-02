/* eslint-disable react/jsx-pascal-case */
import React, { memo, useEffect, useRef, useState } from 'react';
import MaterialReactTable, { MRT_ColumnDef, MRT_ShowHideColumnsButton } from 'material-react-table';
import { Alert, AlertTitle, Badge, Box, Chip, CircularProgress, Dialog, IconButton, Tooltip } from '@mui/material';
import { Close, FileDownload, FilterList } from '@mui/icons-material';
import { CSVLink } from 'react-csv';
import isoDateLocalDate from '../../utilities/helperUtils';
import LoadingState from '../../constants/loadingState';
import { Member } from '../../types/dtos';

interface MembersProps {
  isMembersLoading: boolean,
  memberList: Member[],
  memberListError: boolean,
  memberListErrorMessage: string,
  projectAbbrev: string,
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
  { accessorKey: 'lastLoggedIn', header: 'Last Logged In', Cell: ({ cell }: any) => <>{isoDateLocalDate(cell)}</> },
];

function MemberList(props: MembersProps) {
  const { isMembersLoading,
    memberList,
    memberListError,
    memberListErrorMessage,
    projectAbbrev } = props;

  const [exportCSVStatus, setExportCSVStatus] = useState(LoadingState.IDLE);
  const [transformedData, setTransformedData] = useState<any[]>([]);

  const generateFilename = () => {
    const dateObject = new Date();
    const year = dateObject.toLocaleString('default', { year: 'numeric' });
    const month = dateObject.toLocaleString('default', { month: '2-digit' });
    const day = dateObject.toLocaleString('default', { day: '2-digit' });
    return `austrakka_${projectAbbrev}_users_export_${year}${month}${day}`;
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
        organization: member.organization.abbreviation, // Assuming organization is an object with a 'name' property
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
        enableHiding={false}
        enableDensityToggle={false}
        muiTableProps={{
          sx: {
            width: 'auto', tableLayout: 'auto', '& td:last-child': { width: '100%' }, '& th:last-child': { width: '100%' },
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
        renderToolbarInternalActions={({ table }) => (
          <Box>
            {ExportButton}
            <Tooltip title="Show/Hide filters" placement="top" arrow>
              <IconButton
                onClick={handleExportCSV}
                disabled={memberList.length < 1}
              >
                <Badge
                  badgeContent={memberList.length}
                  color="primary"
                  showZero
                  invisible={memberList.length < 1}
                >
                  <FilterList />
                </Badge>
              </IconButton>
            </Tooltip>
            <MRT_ShowHideColumnsButton table={table} />
          </Box>
        )}
      />
    </>
  );
}
export default memo(MemberList);
