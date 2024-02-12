import React, { memo, useEffect, useState } from 'react';
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table';
import { useNavigate } from 'react-router-dom';
import { isoDateLocalDate } from '../../utilities/helperUtils';
import { Project } from '../../types/dtos';
import { ResponseObject } from '../../types/responseObject.interface';
import { getTrees } from '../../utilities/resourceUtils';
import { useApi } from '../../app/ApiContext';
import { ResponseType } from '../../constants/responseType';

interface TreesProps {
  projectDetails: Project | null
  isTreesLoading: boolean,
  setIsTreesLoading: React.Dispatch<React.SetStateAction<boolean>>,
}

const treeTableColumns: MRT_ColumnDef[] = [
  { accessorKey: 'abbreviation', header: 'Abbreviation' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'description', header: 'Description' },
  { accessorKey: 'latestTreeLastUpdated', header: 'Updated', Cell: ({ cell }: any) => <>{isoDateLocalDate(cell.getValue())}</> },
];

function TreeList(props: TreesProps) {
  const { projectDetails, isTreesLoading, setIsTreesLoading } = props;

  const [treeList, setTreeList] = useState<[]>([]);
  const [treeListError, setTreeListError] = useState(false);
  const [treeListErrorMessage, setTreeListErrorMessage] = useState('');
  const navigate = useNavigate();
  const { token } = useApi();

  useEffect(() => {
    async function getTreeList() {
      const treeListResponse: ResponseObject = await getTrees(projectDetails!.abbreviation, token);
      if (treeListResponse.status === ResponseType.Success) {
        setTreeList(treeListResponse.data);
        setTreeListError(false);
        setIsTreesLoading(false);
      } else {
        setIsTreesLoading(false);
        setTreeList([]);
        setTreeListError(true);
        setTreeListErrorMessage(treeListResponse.message);
      }
    }

    if (projectDetails) {
      getTreeList();
    }
  }, [projectDetails, setIsTreesLoading, token]);

  const rowClickHandler = (row: any) => {
    navigate(`/projects/${projectDetails!.abbreviation}/trees/${row.original.analysisId}/versions/latest`);
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
