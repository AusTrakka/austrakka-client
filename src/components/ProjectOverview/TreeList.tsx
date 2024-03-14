import React, { memo, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, DataTableFilterMeta, DataTableFilterMetaData, DataTableRowClickEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Alert, Box, IconButton, Paper, TextField, Tooltip } from '@mui/material';
import { FilterMatchMode } from 'primereact/api';
import { ManageSearch } from '@mui/icons-material';
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
  const [globalFilter, setGlobalFilter] = useState<DataTableFilterMeta>(
    { global: { value: null, matchMode: FilterMatchMode.CONTAINS } },
  );
  const [treeList, setTreeList] = useState<[]>([]);
  const [treeListError, setTreeListError] = useState(false);
  const [treeListErrorMessage, setTreeListErrorMessage] = useState('');
  const navigate = useNavigate();
  const { token } = useApi();
  const inputRef = useRef<HTMLInputElement>(null);

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

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const filters = { ...globalFilter };
    (filters.global as DataTableFilterMetaData).value = value;
    setGlobalFilter(filters);
  };

  const rowClickHandler = (row: DataTableRowClickEvent) => {
    navigate(`/projects/${projectDetails!.abbreviation}/trees/${row.data.analysisId}/versions/latest`);
  };

  const header = (
    <Box style={{ display: 'flex', alignItems: 'center' }}>
      <Tooltip title="Keyword Search" placement="top">
        <IconButton size="small" onClick={() => inputRef.current?.focus()}>
          <ManageSearch />
        </IconButton>
      </Tooltip>
      <TextField
        inputRef={inputRef}
        sx={{
          'marginBottom': 1,
          'width': 0,
          '&:focus-within': {
            width: 200,
          },
          'transition': 'width 0.5s',
        }}
        id="global-filter"
        label="Search"
        type="search"
        variant="standard"
        color="success"
        size="small"
        value={(globalFilter.global as DataTableFilterMetaData).value || ''}
        onChange={onGlobalFilterChange}
      />
    </Box>
  );

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
          filters={globalFilter}
          header={header}
          globalFilterFields={columns.map((col) => col.field)}
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
