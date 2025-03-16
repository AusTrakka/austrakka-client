import React, { memo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, DataTableFilterMeta, DataTableFilterMetaData, DataTableRowClickEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Alert, Paper } from '@mui/material';
import { FilterMatchMode } from 'primereact/api';
import { Project } from '../../types/dtos';
import SearchInput from '../TableComponents/SearchInput';
import sortIcon from '../TableComponents/SortIcon';
import { isoDateLocalDate } from '../../utilities/dateUtils';

interface TreesProps {
  projectDetails: Project | null
  isTreesLoading: boolean,
  setIsTreesLoading: React.Dispatch<React.SetStateAction<boolean>>,
}

function TreeList(props: TreesProps) {
  const { projectDetails, isTreesLoading, setIsTreesLoading } = props;
  const columns = [
    { field: 'abbreviation', header: 'Abbreviation' },
    { field: 'name', header: 'Name' },
    { field: 'description', header: 'Description' },
    { field: 'latestTreeLastUpdated', header: 'Updated', body: (rowData: any) => isoDateLocalDate(rowData.latestTreeLastUpdated) },
  ];
  const [globalFilter, setGlobalFilter] = useState<DataTableFilterMeta>(
    { global: { value: null, matchMode: FilterMatchMode.CONTAINS } },
  );
  const [treeList, setTreeList] = useState<[]>([]);
  const [treeListError, setTreeListError] = useState(false);
  const [treeListErrorMessage, setTreeListErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // For now, empty: TODO need a tree slice
    setTreeList([]);
    setIsTreesLoading(false);
  }, []);

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
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
      <SearchInput
        value={(globalFilter.global as DataTableFilterMetaData).value || ''}
        onChange={onGlobalFilterChange}
      />
    </div>
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
