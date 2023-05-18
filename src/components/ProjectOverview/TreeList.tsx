import React, { memo } from 'react';
import MaterialReactTable from 'material-react-table';
import { Alert } from '@mui/material';

interface TreesProps {
  isTreesLoading: boolean
}

function TreeList(props: TreesProps) {
  const { isTreesLoading } = props;
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
        columns={[]}
        data={[]}
      />
    </>
  );
}
export default memo(TreeList);
