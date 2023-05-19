import React, { memo } from 'react';
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table';
import { Alert } from '@mui/material';

interface TreesProps {
  isTreesLoading: boolean,
  treeList: any,
  // eslint-disable-next-line react/no-unused-prop-types
  projectAbbrev: string,
  treeListError: boolean,
  treeListErrorMessage: string,
}

const treeTableColumns: MRT_ColumnDef[] = [
  { accessorKey: 'abbreviation', header: 'Abbreviation' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'description', header: 'Description' },
  { accessorKey: 'created', header: 'Created' },
];

function TreeList(props: TreesProps) {
  const { isTreesLoading, treeList, treeListError, treeListErrorMessage } = props;
  return (
    <>
      {isTreesLoading}
      <Alert
        severity="info"
        sx={{ marginBottom: 3 }}
      >
        Please note -
        the tree viewer feature is not ready just yet,
        but we will let you know when it is!
      </Alert>
      <MaterialReactTable
        columns={treeTableColumns}
        data={treeList}
        state={{
          showAlertBanner: treeListError,
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
          treeListError
            ? {
              color: 'error',
              children: treeListErrorMessage,
            }
            : undefined
        }
      />
    </>
  );
}
export default memo(TreeList);
