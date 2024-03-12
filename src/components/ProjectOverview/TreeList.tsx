import React, { memo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, DataTableRowClickEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Alert, Paper } from '@mui/material';
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

function TreeList(props: TreesProps) {
  const { projectDetails, isTreesLoading, setIsTreesLoading } = props;
  const [columns] = useState([
    { field: 'abbreviation', header: 'Abbreviation' },
    { field: 'name', header: 'Name' },
    { field: 'description', header: 'Description' },
    { field: 'latestTreeLastUpdated', header: 'Updated', body: (rowData: any) => isoDateLocalDate(rowData.latestTreeLastUpdated) },
  ]);
  const [treeList, setTreeList] = useState<[]>([]);
  const [treeListError, setTreeListError] = useState(false);
  const [treeListErrorMessage, setTreeListErrorMessage] = useState('');
  const navigate = useNavigate();
  const { token } = useApi();

  useEffect(() => {
    async function getTreeList() {
      const treeListResponse: ResponseObject = await getTrees(projectDetails!.abbreviation, token);
      if (treeListResponse.status === ResponseType.Success) {
        const newData = treeListResponse.data.map((tree: any) => ({
          ...tree,
          latestTreeLastUpdated: new Date(tree.latestTreeLastUpdated),
        }));
        setTreeList(newData);
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

  const rowClickHandler = (row: DataTableRowClickEvent) => {
    navigate(`/projects/${projectDetails!.abbreviation}/trees/${row.data.analysisId}/versions/latest`);
  };

  if (isTreesLoading) return null;

  return (
    treeListError ? (
      <Alert severity="error">
        {treeListErrorMessage}
      </Alert>
    ) : (
      <Paper elevation={2} sx={{ marginBottom: 10 }}>
        <DataTable
          value={treeList}
          selectionMode="single"
          onRowClick={rowClickHandler}
          showGridlines
          resizableColumns
          scrollable
          size="small"
          scrollHeight="calc(100vh - 500px)"
          removableSort
        >
          {columns.map((col) => (
            <Column
              key={col.field}
              field={col.field}
              header={col.header}
              body={col.body}
              sortable
              resizeable
              style={{ minWidth: '150px' }}
            />
          ))}
        </DataTable>
      </Paper>
    )
  );
}
export default memo(TreeList);
