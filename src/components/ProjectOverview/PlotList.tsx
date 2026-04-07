import { Paper, Typography } from '@mui/material';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import {
  DataTable,
  type DataTableFilterMeta,
  type DataTableFilterMetaData,
  type DataTableRowClickEvent,
} from 'primereact/datatable';
import type React from 'react';
import { memo, useEffect, useState } from 'react';
import { useApi } from '../../app/ApiContext';
import { useStableNavigate } from '../../app/NavigationContext';
import { ResponseType } from '../../constants/responseType';
import type { PlotListing, Project } from '../../types/dtos';
import type { ResponseObject } from '../../types/responseObject.interface';
import { getPlots } from '../../utilities/resourceUtils';
import SearchInput from '../TableComponents/SearchInput';
import sortIcon from '../TableComponents/SortIcon';

import { plotTypeListing } from '../../config/plotTypes';

interface PlotListProps {
  projectDetails: Project | null,
  setIsLoading: Function,
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
  }];

  useEffect(() => {
    async function getPlotList() {
      const plotsResponse: ResponseObject = await getPlots(projectDetails!.projectId, token);
      if (plotsResponse.status === ResponseType.Success) {
        const tableData: PlotListing[] = plotsResponse.data;
        setPlotList(tableData); 
        setIsLoading(false);
      } else {
        setPlotList([]);
        // TODO set plots errors
      }
    }

    if (projectDetails) {
      // TODO to enable display of custom plots, uncomment. 
      //  Check layout first! Current layout is a placeholder
      //getPlotList();
      setIsLoading(false);
    }
  }, [projectDetails, setIsLoading, token]);

  // Just navigate to the plot type URL
  const staticRowClickHandler = (row: DataTableRowClickEvent) => {
    navigate(`/projects/${projectDetails!.abbreviation}/plots/${row.data.plotType}`);
  };
  
  const customRowClickHandler = (row: DataTableRowClickEvent) => {
    // TODO later may want plot configString suffix
    navigate(`/projects/${projectDetails!.abbreviation}/plots/${row.data.abbreviation}`);
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
    <>
    <Paper elevation={2} sx={{ marginBottom: 10 }}>
      <DataTable
        value={plotTypeListing}
        selectionMode="single"
        onRowClick={staticRowClickHandler}
        showGridlines
        resizableColumns
        scrollable
        size="small"
        scrollHeight="calc(100vh - 300px)"
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
    { // TODO this placeholder layout will not trigger unless plot fetch is enabled, above
      plotList.length > 0 && (
      <Paper>
        <Typography variant="h6" color="textSecondary" sx={{ flexGrow: 1 }}>
          Project plots
        </Typography>
        <DataTable
          value={plotList}
          selectionMode="single"
          onRowClick={customRowClickHandler}
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
    )}
    </>
  );
}
export default memo(PlotList);
