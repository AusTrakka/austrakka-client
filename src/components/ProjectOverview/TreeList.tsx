import React, { memo, useEffect, useState } from 'react';
import { DataTable, DataTableFilterMeta, DataTableFilterMetaData, DataTableRowClickEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Alert, Paper } from '@mui/material';
import { FilterMatchMode } from 'primereact/api';
import { Project, Tree } from '../../types/dtos';
import { ResponseObject } from '../../types/responseObject.interface';
import { getTrees } from '../../utilities/resourceUtils';
import { useApi } from '../../app/ApiContext';
import { ResponseType } from '../../constants/responseType';
import SearchInput from '../TableComponents/SearchInput';
import sortIcon from '../TableComponents/SortIcon';
import { isoDateLocalDate } from '../../utilities/dateUtils';
import { useStableNavigate } from '../../app/NavigationContext';

interface TreesProps {
  projectDetails: Project | null
  setIsLoading: (isLoading: boolean) => void
}

function TreeList(props: TreesProps) {
  const { projectDetails, setIsLoading } = props;
  
  const { navigate } = useStableNavigate();
  const columns = [
    { field: 'abbreviation', header: 'Abbreviation' },
    { field: 'name', header: 'Name' },
    { field: 'description', header: 'Description' },
    { field: 'latestTreeLastUpdated', header: 'Updated', body: (rowData: any) => isoDateLocalDate(rowData.latestTreeLastUpdated) },
  ];
  const [globalFilter, setGlobalFilter] = useState<DataTableFilterMeta>(
    { global: { value: null, matchMode: FilterMatchMode.CONTAINS } },
  );
  const [treeList, setTreeList] = useState<Tree[]>([]);
  const [treeListError, setTreeListError] = useState(false);
  const [treeListErrorMessage, setTreeListErrorMessage] = useState('');
  const { token } = useApi();

  useEffect(() => {
    async function getTreeList() {
      const treeListResponse: ResponseObject = await getTrees(
        projectDetails!.abbreviation,
        false,
        token,
      );
      if (treeListResponse.status === ResponseType.Success) {
        setTreeList(treeListResponse.data);
        setTreeListError(false);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setTreeList([]);
        setTreeListError(true);
        setTreeListErrorMessage(treeListResponse.message);
      }
    }

    if (projectDetails) {
      getTreeList();
    }
  }, [projectDetails, setIsLoading, token]);

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const filters = { ...globalFilter };
    (filters.global as DataTableFilterMetaData).value = value;
    setGlobalFilter(filters);
  };

  const rowClickHandler = (row: DataTableRowClickEvent) => {
    navigate(`/projects/${projectDetails!.abbreviation}/trees/${row.data.treeId}/versions/latest`);
  };

  const header = (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
      <SearchInput
        value={(globalFilter.global as DataTableFilterMetaData).value || ''}
        onChange={onGlobalFilterChange}
      />
    </div>
  );

  // if (isLoading) return null;

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
          sortField="latestTreeLastUpdated"
          sortOrder={-1}
          removableSort
          reorderableColumns
          columnResizeMode="expand"
          className="my-flexible-table"
          sortIcon={sortIcon}
        >
          {columns.map((col) => (
            <Column
              key={col.field}
              field={col.field}
              header={col.header}
              body={col.body}
              sortable
              resizeable
              headerClassName="custom-title"
              className="flexible-column"
              bodyClassName="value-cells"
            />
          ))}
        </DataTable>
      </Paper>
    )
  );
}
export default memo(TreeList);
