import { Close } from '@mui/icons-material';
import { Alert, AlertTitle, Dialog, IconButton, Paper } from '@mui/material';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import {
  DataTable,
  type DataTableFilterMeta,
  type DataTableFilterMetaData,
  type DataTableRowClickEvent,
} from 'primereact/datatable';
import type React from 'react';
import { memo, useEffect, useRef, useState } from 'react';
import type { CSVLink } from 'react-csv';
import { useApi } from '../../app/ApiContext';
import { useStableNavigate } from '../../app/NavigationContext';
import LoadingState from '../../constants/loadingState';
import { ResponseType } from '../../constants/responseType';
import type { Member, Project } from '../../types/dtos';
import type { ResponseObject } from '../../types/responseObject.interface';
import { getProjectMembers } from '../../utilities/resourceUtils';
import { renderList } from '../../utilities/tableUtils';
import ExportTableData from '../Common/ExportTableData';
import SearchInput from '../TableComponents/SearchInput';
import sortIcon from '../TableComponents/SortIcon';

interface MemberListProps {
  projectDetails: Project | null;
  setIsLoading: (isLoading: boolean) => void;
}

function MemberList(props: MemberListProps) {
  const { projectDetails, setIsLoading } = props;

  const { navigate } = useStableNavigate();
  const [exportCSVStatus, setExportCSVStatus] = useState(LoadingState.IDLE);
  const [exportData, setExportData] = useState<Member[]>([]);
  const [memberList, setMemberList] = useState<Member[]>([]);
  const columns = [
    { field: 'displayName', header: 'Name' },
    {
      field: 'contactEmail',
      header: 'Email',
      body: (rowData: any) => rowData.contactEmail ?? 'Unavailable',
    },
    {
      field: 'organization.abbreviation',
      header: 'Organisations',
      body: (rowData: any) => rowData.organization?.abbreviation,
    },
    { field: 'roles', header: 'Roles', body: (rowData: any) => renderList(rowData.roles) },
  ];
  const [globalFilter, setGlobalFilter] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [memberListError, setMemberListError] = useState(false);
  const [memberListErrorMessage, setMemberListErrorMessage] = useState('');
  const { token } = useApi();

  useEffect(() => {
    async function getMemberList() {
      const memberListResponse: ResponseObject = await getProjectMembers(
        projectDetails!.abbreviation,
        token,
      );
      if (memberListResponse.status === ResponseType.Success) {
        setMemberList(memberListResponse.data as Member[]);
        setExportData(memberListResponse.data as Member[]);
        setMemberListError(false);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setMemberList([]);
        setMemberListError(true);
        setMemberListErrorMessage(memberListResponse.message);
      }
    }

    if (projectDetails) {
      getMemberList();
    }
  }, [projectDetails, setIsLoading, token]);

  const csvLink = useRef<CSVLink & HTMLAnchorElement & { link: HTMLAnchorElement }>(null);

  useEffect(() => {
    if (exportCSVStatus === LoadingState.SUCCESS) {
      try {
        csvLink.current?.link.click();
        setExportCSVStatus(LoadingState.IDLE);
      } catch (_error) {
        setExportCSVStatus(LoadingState.ERROR);
      }
    }
  }, [exportCSVStatus]);

  const rowClickHandler = (row: DataTableRowClickEvent) => {
    const selectedRow = row; // Assuming "original" contains the row data
    // Check if the "Object Id" property exists in the selected row
    if ('username' in selectedRow.data) {
      const { username } = selectedRow.data; // Replace "objectId" with the actual property name
      const url = `/users/${username}`;
      navigate(url);
    } else {
      // biome-ignore lint/suspicious/noConsole: historic
      console.error('Username not found in selectedRow.');
    }
  };

  const handleDialogClose = () => {
    setExportCSVStatus(LoadingState.IDLE);
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const filters = { ...globalFilter };
    (filters.global as DataTableFilterMetaData).value = value;
    setGlobalFilter(filters);
  };

  const header = (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SearchInput
          value={(globalFilter.global as DataTableFilterMetaData).value || ''}
          onChange={onGlobalFilterChange}
        />
        <ExportTableData
          disabled={exportData.length < 1}
          dataToExport={exportData.map((data) => ({
            displayName: data.displayName,
            organization: data.organization.abbreviation,
            roles: data.roles,
          }))}
          fileNamePrefix={`${projectDetails?.abbreviation ?? 'project'}_members`}
          headers={['displayName', 'organization', 'roles']}
        />
      </div>
    </div>
  );

  return (
    <>
      {memberListError ? (
        <Alert severity="error">{memberListErrorMessage}</Alert>
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
              Please try again later, or contact the {import.meta.env.VITE_BRANDING_NAME} team.
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
              scrollHeight="calc(100vh - 300px)"
              reorderableColumns
              showGridlines
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
                  bodyClassName="value-cells"
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
