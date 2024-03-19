import React, { memo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, DataTableFilterMeta, DataTableFilterMetaData } from 'primereact/datatable';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import { Paper } from '@mui/material';
import { isoDateLocalDate } from '../../utilities/helperUtils';
import { PlotListing, Project } from '../../types/dtos';
import { useApi } from '../../app/ApiContext';
import { ResponseObject } from '../../types/responseObject.interface';
import { getPlots } from '../../utilities/resourceUtils';
import { ResponseType } from '../../constants/responseType';
import SearchInput from '../TableComponents/SearchInput';
import sortIcon from '../TableComponents/SortIcon';

interface PlotListProps {
  projectDetails: Project | null
  isPlotsLoading: boolean
  setIsPlotsLoading: React.Dispatch<React.SetStateAction<boolean>>
}

function PlotList(props: PlotListProps) {
  const { projectDetails, isPlotsLoading, setIsPlotsLoading } = props;

  const [plotList, setPlotList] = useState<PlotListing[]>([]);
  const navigate = useNavigate();
  const { token } = useApi();
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

  useEffect(() => {
    async function getPlotList() {
      const plotsResponse: ResponseObject = await getPlots(projectDetails!.projectId, token);
      if (plotsResponse.status === ResponseType.Success) {
        setPlotList(plotsResponse.data as PlotListing[]);
        setIsPlotsLoading(false);
      } else {
        setIsPlotsLoading(false);
        setPlotList([]);
        // TODO set plots errors
      }
    }

    if (projectDetails) {
      getPlotList();
    }
  }, [projectDetails, setIsPlotsLoading, token]);

  const rowClickHandler = (row: any) => {
    navigate(`/projects/${projectDetails!.abbreviation}/plots/${row.original.abbreviation}`);
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
          />
        ))}
      </DataTable>
    </Paper>
  );
}
export default memo(PlotList);
