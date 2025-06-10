import React, { memo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, DataTableFilterMeta, DataTableFilterMetaData, DataTableRowClickEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Alert, Paper } from '@mui/material';
import { FilterMatchMode } from 'primereact/api';
import { TreeVersion } from '../../types/dtos';
import SearchInput from '../TableComponents/SearchInput';
import sortIcon from '../TableComponents/SortIcon';
import { selectTrees } from '../../app/treeSlice';
import { useAppSelector } from '../../app/store';

// TODO if there's only one tree in the list, select it immediately

function TreeList() {
  // NB this is a list of TreeVersions. In the standalone client, we assume one "version" per tree
  const columns = [
    { field: 'treeName', header: 'Name' },
  ];
  const [globalFilter, setGlobalFilter] = useState<DataTableFilterMeta>(
    { global: { value: null, matchMode: FilterMatchMode.CONTAINS } },
  );
  const [treeListError, setTreeListError] = useState(false);
  const [treeListErrorMessage, setTreeListErrorMessage] = useState('');
  const navigate = useNavigate();
  const treeList: TreeVersion[] = useAppSelector(state => selectTrees(state));

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const filters = { ...globalFilter };
    (filters.global as DataTableFilterMetaData).value = value;
    setGlobalFilter(filters);
  };

  const rowClickHandler = (row: DataTableRowClickEvent) => {
    navigate(`/data/trees/${row.data.treeId}`);
  };

  const header = (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
      <SearchInput
        value={(globalFilter.global as DataTableFilterMetaData).value || ''}
        onChange={onGlobalFilterChange}
      />
    </div>
  );
  
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
