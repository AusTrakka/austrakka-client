import React, { memo, useEffect, useState } from 'react';
import { DataTable, DataTableFilterMeta, DataTableFilterMetaData, DataTableRowClickEvent } from 'primereact/datatable';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import { IconButton, Paper } from '@mui/material';
import { Public } from '@mui/icons-material';
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
        setPlotList(plotsResponse.data as PlotListing[]);
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
    navigate(`/projects/${projectDetails!.abbreviation}/plots/${row.data.abbreviation}`);
  };
  
  const goToMapsPage = () => {
    navigate(`/projects/${projectDetails!.abbreviation}/map`);
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
      <IconButton
        aria-label="go to maps temp"
        size="small"
        onClick={() => goToMapsPage()}
      >
        <Public />
      </IconButton>
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
