import React, { useEffect, useState } from 'react';
import { Paper, Skeleton } from '@mui/material';
import { DataTable, DataTableSelectAllChangeEvent } from 'primereact/datatable';
import { MultiSelect, MultiSelectChangeEvent } from 'primereact/multiselect';
import { Column } from 'primereact/column';
import { Field } from '../../types/dtos';
import { buildPrimeReactColumnDefinitions } from '../../utilities/tableUtils';
import { DataFilter } from '../DataFilters/DataFilters';
import ExportTableData from '../Common/ExportTableData';
import LoadingState from '../../constants/loadingState';
import MetadataLoadingState from '../../constants/metadataLoadingState';
import { Sample } from '../../types/sample.interface';

interface TreeTableProps {
  selectedIds: string[],
  setSelectedIds: any,
  displayFields: Field[],
  tableMetadata: any,
  metadataLoadingState: MetadataLoadingState,
  fieldLoadingState: Record<string, LoadingState>,
}

interface BodyComponentProps {
  col: Sample,
  readyFields: Record<string, LoadingState>,
}

function BodyComponent(props: BodyComponentProps) {
  const { col, readyFields } = props;
  return readyFields[col.field] !== LoadingState.SUCCESS ? (
    <Skeleton /> // Replace with your skeleton component
  ) : (
    col.body// Wrap your existing body content
  );
}

export default function TreeTable(props: TreeTableProps) {
  const {
    selectedIds,
    setSelectedIds,
    displayFields,
    tableMetadata,
    metadataLoadingState,
    fieldLoadingState,
  } = props;
  const [formattedData, setFormattedData] = useState<Sample[]>([]);
  const [sampleTableColumns, setSampleTableColumns] = useState<Sample[]>([]);
  const [columnError, setColumnError] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [displayRows, setDisplayRows] = useState<Sample[]>([]);
  const [selectedSamples, setSelectedSamples] = useState<Sample[]>([]);
  const [filteredData, setFilteredData] = useState<Sample[]>([]);
  const [exportCSVStatus, setExportCSVStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [selectAll, setSelectAll] = useState(false);
  const [allIds, setAllIds] = useState<string[]>([]);
  const [isDataFiltersOpen, setIsDataFiltersOpen] = useState(true);
  const [filterList, setFilterList] = useState<DataFilter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Format display fields into column headers
  useEffect(
    () => {
      const formatTableHeaders = () => {
        const columnBuilder = buildPrimeReactColumnDefinitions(displayFields);
        setSampleTableColumns(columnBuilder);
        setColumnError(false);
      };
      if (!columnError) {
        formatTableHeaders();
      }
    },
    [columnError, displayFields],
  );

  // Format tableMetadata in the correct way for the table to ingest
  useEffect(() => {
    const tableValues: any = [];
    const fields = displayFields.map(field => field.columnName);
    if (metadataLoadingState === MetadataLoadingState.IDLE ||
      metadataLoadingState === MetadataLoadingState.AWAITING_FIELDS ||
      metadataLoadingState === MetadataLoadingState.AWAITING_DATA) {
      setLoading(true);
      return;
    }
    // Find display field matches in top level object and in metadataValues kv pairs
    tableMetadata.forEach((element: any) => {
      const entry: any = {};
      for (const [key, value] of Object.entries(element) as [key: string, value: any]) {
        if (fields.includes(key)) {
          entry[key] = value;
        } else if (key === 'sampleName') {
          entry.Seq_ID = value;
        } else if (key === 'metadataValues') {
          value.forEach((kv: any) => {
            if (fields.includes(kv.key)) {
              entry[kv.key] = kv.value;
            }
          });
        }
      }
      tableValues.push(entry);
    });
    setLoading(false);
    setAllIds(tableValues.map((sample: any) => sample.Seq_ID));
    setFormattedData(tableValues);
  }, [tableMetadata, displayFields, metadataLoadingState]);

  useEffect(() => {
    setLoading(false);
    setFilteredData(formattedData);
    setDisplayRows(formattedData);
  }, [formattedData]);

  const rowVisibilityHandler = () => {
    const newState = !isHidden;
    if (newState === true) {
      // Filter rows based on ID field
      const filtered = filteredData.filter((e: any) => selectedIds.includes(e.Seq_ID));
      setDisplayRows(filtered);
    } else {
      setDisplayRows(filteredData);
    }
    setIsHidden(newState);
  };

  useEffect(() => {
    if (selectAll) {
      setSelectedIds(allIds);
    } else {
      setSelectedIds(selectedSamples.map((sample: any) => sample.Seq_ID));
    }
  }, [allIds, selectAll, selectedSamples, setSelectedIds]);

  useEffect(() => {
    // If table filter changes, show all rows again and unselect all
    setDisplayRows(filteredData);
    setIsHidden(false);
  }, [filteredData]);

  // Dynamically show extra rows as they are selected
  useEffect(() => {
    if (isHidden === true) {
      const filtered = filteredData.filter((e: any) => selectedIds.includes(e.Seq_ID));
      setDisplayRows(filtered);
    } else {
      setDisplayRows(filteredData);
    }
  }, [filteredData, isHidden, selectedIds]);

  // Update CSV export status as data loads
  // CSV export is not permitted until data is FULLY loaded
  // If a load error occurs, we will pass no data to the ExportTableData component
  // However we don't set an error here as we want to see a load error, not CSV download error
  useEffect(() => {
    setExportCSVStatus(
      metadataLoadingState === MetadataLoadingState.IDLE ||
      metadataLoadingState === MetadataLoadingState.AWAITING_DATA ||
      metadataLoadingState === MetadataLoadingState.PARTIAL_DATA_LOADED ?
        LoadingState.LOADING :
        LoadingState.SUCCESS,
    );
  }, [metadataLoadingState]);

  const onColumnToggle = (event: MultiSelectChangeEvent) => {
    const selectedColumns = event.value as Sample[];
    const newColumns = sampleTableColumns.map((col) => {
      const newCol = { ...col };
      newCol.hidden = selectedColumns.some((selectedCol) => selectedCol.field === col.field);
      return newCol;
    });
    setSampleTableColumns(newColumns);
  };

  const onSelectAllChange = (e: DataTableSelectAllChangeEvent) => {
    const { checked } = e;

    if (checked) {
      setSelectAll(true);
      setSelectedSamples(displayRows);
    } else {
      setSelectAll(false);
      setSelectedSamples([]);
    }
  };

  const header = (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <MultiSelect
          value={sampleTableColumns.filter((col: Sample) => col.hidden === true)}
          options={sampleTableColumns}
          optionLabel="header"
          onChange={onColumnToggle}
          display="chip"
          placeholder="Hide Columns"
          className="w-full sm:w-20rem"
          filter
          showSelectAll
        />
        <ExportTableData
          dataToExport={displayRows}
          exportCSVStatus={exportCSVStatus}
          setExportCSVStatus={setExportCSVStatus}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* <DataFilters
        data={formattedData}
        fields={displayFields}
        setFilteredData={setFilteredData}
        filterList={filterList}
        setFilterList={setFilterList}
        isOpen={isDataFiltersOpen}
        setIsOpen={setIsDataFiltersOpen}
      /> */}
      <Paper>
        <div>
          <DataTable
            value={displayRows ?? []}
            dataKey="Seq_ID"
            size="small"
            removableSort
            showGridlines
            scrollable
            scrollHeight="calc(100vh - 300px)"
            paginator
            rows={25}
            resizableColumns
            columnResizeMode="expand"
            rowsPerPageOptions={[25, 50, 100, 500]}
            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink JumpToPageDropDown"
            currentPageReportTemplate=" Viewing: {first} to {last} of {totalRecords}"
            paginatorPosition="bottom"
            paginatorLeft
            loading={loading}
            header={header}
            reorderableColumns
            selectionMode="multiple"
            selection={selectedSamples}
            selectAll={selectAll}
            onSelectAllChange={onSelectAllChange}
            onSelectionChange={(e: any) => setSelectedSamples(e.value as Sample[])}
          >
            <Column selectionMode="multiple" style={{ width: '3em' }} />
            {sampleTableColumns.map((col: Sample) => (
              <Column
                key={col.field}
                field={col.field}
                header={col.header}
                body={BodyComponent({ col, readyFields: fieldLoadingState })}
                hidden={col.hidden}
                sortable
                resizeable
                style={{ minWidth: '150px' }}
              />
            ))}
          </DataTable>
        </div>
      </Paper>
    </>
  );
}
