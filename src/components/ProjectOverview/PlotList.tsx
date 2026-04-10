import { Paper } from '@mui/material';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import {
  DataTable,
  type DataTableFilterMeta,
  type DataTableFilterMetaData,
  type DataTableRowClickEvent,
} from 'primereact/datatable';
import type React from 'react';
import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { plotTypeListing } from '../../config/plotTypes';
import type { Project } from '../../types/dtos';
import SearchInput from '../TableComponents/SearchInput';
import sortIcon from '../TableComponents/SortIcon';

interface PlotListProps {
  projectDetails: Project | null;
}

function PlotList(props: PlotListProps) {
  const navigate = useNavigate();
  const [globalFilter, setGlobalFilter] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const columns = [
    {
      field: 'name',
      header: 'Name',
    },
    {
      field: 'description',
      header: 'Description',
    },
  ];

  const rowClickHandler = (row: DataTableRowClickEvent) => {
    navigate(`/data/plots/${row.data.plotType}`);
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const filters = { ...globalFilter };
    (filters.global as DataTableFilterMetaData).value = value;
    setGlobalFilter(filters);
  };

  const header = (
    <div style={{ display: 'flex' }}>
      <SearchInput
        value={(globalFilter.global as DataTableFilterMetaData).value || ''}
        onChange={onGlobalFilterChange}
      />
    </div>
  );

  return (
    <Paper elevation={2} sx={{ marginBottom: 10 }}>
      <DataTable
        value={plotTypeListing}
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
        columnResizeMode="expand"
        removableSort
        className="my-flexible-table"
        sortIcon={sortIcon}
      >
        {columns.map((col: any) => (
          <Column
            key={col.field}
            field={col.field}
            header={col.header}
            body={col.body}
            resizeable
            style={{ minWidth: '150px' }}
            headerClassName="custom-title"
            className="flexible-column"
          />
        ))}
      </DataTable>
    </Paper>
  );
}
export default memo(PlotList);
