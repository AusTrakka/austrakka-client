import React, { memo } from 'react';
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table';
import { useNavigate } from 'react-router-dom';
import isoDateLocalDate from '../../utilities/helperUtils';

interface TreesProps {
  treeList: any,
  projectAbbrev: string,
  treeListError: boolean,
  treeListErrorMessage: string,
  isTreesLoading: boolean,
}

const treeTableColumns: MRT_ColumnDef[] = [
  { accessorKey: 'abbreviation', header: 'Abbreviation' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'description', header: 'Description' },
  { accessorKey: 'latestTreeLastUpdated', header: 'Updated', Cell: ({ cell }: any) => <>{isoDateLocalDate(cell.getValue())}</> },
];

function TreeList(props: TreesProps) {
  const { treeList, treeListError, treeListErrorMessage, isTreesLoading, projectAbbrev } = props;
  const navigate = useNavigate();

  const rowClickHandler = (row: any) => {
    navigate(`/projects/${projectAbbrev}/trees/${row.original.analysisId}/versions/latest`);
  };

  if (isTreesLoading) return null;

  return (
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
          'width': 'auto', 'tableLayout': 'auto', '& td:last-child': { width: '100%' }, '& th:last-child': { width: '100%' },
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
            // Row click handler
      muiTableBodyRowProps={({ row }) => ({
        onClick: () => rowClickHandler(row),
        sx: {
          cursor: 'pointer',
        },
      })}
    />
  );
}
export default memo(TreeList);
