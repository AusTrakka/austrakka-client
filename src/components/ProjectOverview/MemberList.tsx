import React, { memo } from 'react';
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table';
import isoDateLocalDate from '../../utilities/helperUtils';

interface MembersProps {
  isMembersLoading: boolean,
  memberList: any,
  memberListError: boolean,
  memberListErrorMessage: string,
}

// const treeTableColumns: MRT_ColumnDef[] = [
//   { accessorKey: 'abbreviation', header: 'Abbreviation' },
//   { accessorKey: 'name', header: 'Name' },
//   { accessorKey: 'description', header: 'Description' },
// eslint-disable-next-line max-len
//   { accessorKey: 'created', header: 'Created', Cell: ({ cell }: any) => <>{isoDateLocalDate(cell)}</> },
// ];
function reduceList(cell : any): string {
  const roles = cell.getValue();
  if (Array.isArray(roles)) {
    return roles.join(', ');
  }

  return roles;
}

const memberTableColumns: MRT_ColumnDef[] = [
  { accessorKey: 'displayName', header: 'Name' },
  { accessorKey: 'roles', header: 'Roles', Cell: ({ cell }: any) => <>{reduceList(cell)}</> },
  { accessorKey: 'lastLoggedIn', header: 'Last Logged In', Cell: ({ cell }: any) => <>{isoDateLocalDate(cell)}</> },
];

function MemberList(props: MembersProps) {
  const { isMembersLoading,
    memberList,
    memberListError,
    memberListErrorMessage } = props;

  return (
    <>
      {isMembersLoading}
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

      />
    </>
  );
}
export default memo(MemberList);
