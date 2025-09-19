import React, { memo, useEffect, useState } from 'react';
import { DataTable, DataTableFilterMeta, DataTableFilterMetaData, DataTableRowClickEvent } from 'primereact/datatable';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import { Paper } from '@mui/material';
import { PlotListing, Project } from '../../types/dtos';
import { useApi } from '../../app/ApiContext';
import { ResponseObject } from '../../types/responseObject.interface';
import { getPlots } from '../../utilities/resourceUtils';
import { ResponseType } from '../../constants/responseType';
import SearchInput from '../TableComponents/SearchInput';
import sortIcon from '../TableComponents/SortIcon';
import { isoDateLocalDate } from '../../utilities/dateUtils';
import { useStableNavigate } from '../../app/NavigationContext';

interface PlotListProps {
  projectDetails: Project | null
  setIsLoading: (isLoading: boolean) => void;
}

const mapRow = {
  abbreviation: '__MAP__',
  name: 'Project Map',
  description: 'Access the full map',
  created: null,
};

function PlotList(props: PlotListProps) {
  const { projectDetails, setIsLoading } = props;
  const { navigate } = useStableNavigate();
  const [plotList, setPlotList] = useState<PlotListing[]>([]);
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
        const tableData: PlotListing[] = [...plotsResponse.data, mapRow];
        setPlotList(tableData);
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setPlotList([]);
        // TODO set plots errors
      }
    }

    if (projectDetails) {
      getPlotList();
    }
  }, [projectDetails, setIsLoading, token]);

  const rowClickHandler = (row: DataTableRowClickEvent) => {
    if (row.data.abbreviation === '__MAP__') {
      // Special logic for the map
      navigate(`/projects/${projectDetails!.abbreviation}/map`);
    } else {
      // Regular plot row
      navigate(`/projects/${projectDetails!.abbreviation}/plots/${row.data.abbreviation}`);
    }
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const filters = { ...globalFilter };
    (filters.global as DataTableFilterMetaData).value = value;
    setGlobalFilter(filters);
  };

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
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
        scrollHeight="calc(100vh - 300px)"
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
