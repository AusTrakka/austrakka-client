import React, { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, DataTableFilterMeta, DataTableFilterMetaData, DataTableRowClickEvent } from 'primereact/datatable';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import { Paper } from '@mui/material';
import { PlotListing, Project } from '../../types/dtos';
import SearchInput from '../TableComponents/SearchInput';
import sortIcon from '../TableComponents/SortIcon';
import { isoDateLocalDate } from '../../utilities/dateUtils';
import { STATIC_PLOT_LIST } from '../../constants/standaloneClientConstants';

interface PlotListProps {
  projectDetails: Project | null
  isPlotsLoading: boolean
  setIsPlotsLoading: React.Dispatch<React.SetStateAction<boolean>>
}

function PlotList(props: PlotListProps) {
  const { projectDetails, isPlotsLoading, setIsPlotsLoading } = props;

  const [plotList, setPlotList] = useState<PlotListing[]>(STATIC_PLOT_LIST);
  const navigate = useNavigate();
  const [globalFilter, setGlobalFilter] = useState<DataTableFilterMeta>(
    { global: { value: null, matchMode: FilterMatchMode.CONTAINS } },
  );
  const columns = [{
    field: 'name',
    header: 'Name',
  }, {
    field: 'description',
    header: 'Description',
  }, {
    field: 'created',
    header: 'Created',
    body: (rowData: any) => isoDateLocalDate(rowData.created),
  }];

  const rowClickHandler = (row: DataTableRowClickEvent) => {
    navigate(`/projects/${projectDetails!.abbreviation}/plots/${row.data.abbreviation}`);
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const filters = { ...globalFilter };
    (filters.global as DataTableFilterMetaData).value = value;
    setGlobalFilter(filters);
  };

  if (isPlotsLoading) return null;

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
        value={plotList}
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
        reorderableColumns
        className="my-flexible-table"
        sortIcon={sortIcon}
      >
        {columns.map((col: any) => (
          <Column
            key={col.field}
            field={col.field}
            header={col.header}
            body={col.body}
            sortable
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
