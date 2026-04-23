import { Error as ErrorIcon } from '@mui/icons-material';
import { CircularProgress, Paper, Tooltip, Typography } from '@mui/material';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import {
  DataTable,
  type DataTableFilterMeta,
  type DataTableFilterMetaData,
} from 'primereact/datatable';
import { useEffect, useState } from 'react';
import { useApi } from '../../app/ApiContext';
import LoadingState from '../../constants/loadingState';
import { ResponseType } from '../../constants/responseType';
import type { Member } from '../../types/dtos';
import type { ResponseObject } from '../../types/responseObject.interface';
import { getOrgMembers } from '../../utilities/resourceUtils';
import { renderList } from '../../utilities/tableUtils';
import { renderOrgIcon } from '../Admin/UserIconRenderer';
import ExportTableData from '../Common/ExportTableData';
import SearchInput from '../TableComponents/SearchInput';
import sortIcon from '../TableComponents/SortIcon';

interface OrgMembersProps {
  orgAbbrev: string;
}

function renderDisplayName(homeOrg: string, rowData: Member) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {renderOrgIcon(homeOrg, rowData)}
      {rowData.displayName}
    </div>
  );
}

function OrgMembers(props: OrgMembersProps) {
  const { token, tokenLoading } = useApi();
  const { orgAbbrev } = props;
  const [projectMembers, setProjectMembers] = useState<Member[]>([]);
  const [isMemberListLoading, setIsMemberListLoading] = useState(false);
  const [exportData, setExportData] = useState<Member[]>([]);
  const [memberListError, setMemberListError] = useState(false);
  const [memberListErrorMessage, setMemberListErrorMessage] = useState('');
  const [globalFilter, setGlobalFilter] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const columns = [
    {
      field: 'displayName',
      header: 'Name',
      body: (rowData: Member) => renderDisplayName(orgAbbrev, rowData),
    },
    {
      field: 'position',
      header: 'Position',
      body: (rowData: Member) =>
        rowData.position ?? (
          <Typography variant="inherit" color="textDisabled">
            Not Filled
          </Typography>
        ),
    },
    {
      field: 'contactEmail',
      header: 'Email',
      body: (rowData: Member) =>
        rowData.contactEmail ?? (
          <Typography variant="inherit" color="textDisabled">
            Unavailable
          </Typography>
        ),
    },
    {
      field: 'organization.abbreviation',
      header: 'Organisations',
      body: (rowData: Member) => rowData.organization?.abbreviation,
    },
    { field: 'roles', header: 'Roles', body: (rowData: Member) => renderList(rowData.roles) },
  ];

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const filters = { ...globalFilter };
    (filters.global as DataTableFilterMetaData).value = value;
    setGlobalFilter(filters);
  };

  useEffect(() => {
    async function getOrgMembersList() {
      const memberListResponse: ResponseObject = await getOrgMembers(orgAbbrev, token);
      if (memberListResponse.status === ResponseType.Success) {
        setProjectMembers(memberListResponse.data as Member[]);
        setExportData(memberListResponse.data as Member[]);
        setMemberListError(false);
        setIsMemberListLoading(false);
      } else {
        setIsMemberListLoading(false);
        setProjectMembers([]);
        setMemberListError(true);
        setMemberListErrorMessage(memberListResponse.message);
      }
    }

    if (orgAbbrev && tokenLoading !== LoadingState.IDLE && tokenLoading !== LoadingState.LOADING) {
      getOrgMembersList();
    }
  }, [token, tokenLoading, orgAbbrev]);

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
          fileNamePrefix={`${orgAbbrev ?? 'org'}_members`}
          headers={['displayName', 'organization', 'roles']}
        />
      </div>
    </div>
  );

  return (
    <>
      {isMemberListLoading ? <CircularProgress /> : null}
      {memberListError ? (
        <Tooltip title={memberListErrorMessage}>
          <ErrorIcon color="error" />
        </Tooltip>
      ) : (
        <Paper elevation={2} sx={{ marginBottom: 10 }}>
          <DataTable
            value={projectMembers}
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
      )}
    </>
  );
}

export default OrgMembers;
