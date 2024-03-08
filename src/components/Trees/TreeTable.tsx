import React, { useEffect, useState } from 'react';
import { Button, Paper, Skeleton, Tooltip } from '@mui/material';
import { DataTable, DataTableFilterMeta, DataTableSelectAllChangeEvent } from 'primereact/datatable';
import { MultiSelect, MultiSelectChangeEvent } from 'primereact/multiselect';
import { Column } from 'primereact/column';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { ProjectViewField } from '../../types/dtos';
import { buildPrimeReactColumnDefinitions } from '../../utilities/tableUtils';
import DataFilters, { DataFilter } from '../DataFilters/DataFilters';
import ExportTableData from '../Common/ExportTableData';
import LoadingState from '../../constants/loadingState';
import MetadataLoadingState from '../../constants/metadataLoadingState';
import { Sample } from '../../types/sample.interface';

interface TreeTableProps {
  selectedIds: string[],
  setSelectedIds: any,
  displayFields: ProjectViewField[],
  tableMetadata: Sample[],
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
  const [displayRows, setDisplayRows] = useState<Sample[]>([]);
  const [selectedSamples, setSelectedSamples] = useState<Sample[]>([]);
  const [filteredData, setFilteredData] = useState<Sample[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [allIds, setAllIds] = useState<string[]>([]);
  const [isDataFiltersOpen, setIsDataFiltersOpen] = useState(true);
  const [filterList, setFilterList] = useState<DataFilter[]>([]);
  const [currentFilter, setCurrentFilter] = useState<DataTableFilterMeta>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [filteredDataLength, setFilteredDataLength] = useState<number>(0);
  const [showSelectedRowsOnly, setShowSelectedRowsOnly] = useState(false);

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
    setFilteredDataLength(formattedData.length);
    setDisplayRows(formattedData);
  }, [formattedData]);

  useEffect(() => {
    if (selectAll && !currentFilter) {
      setSelectedIds(allIds);
    } else {
      setSelectedIds(selectedSamples.map((sample: any) => sample.Seq_ID));
    }
  }, [allIds, currentFilter, selectAll, selectedSamples, setSelectedIds]);

  useEffect(() => {
    setSelectedIds(selectedIds);
    setSelectedSamples(formattedData.filter((sample: any) => selectedIds.includes(sample.Seq_ID)));
  }, [formattedData, selectedIds, setSelectedIds]);

  useEffect(() => {
    if (showSelectedRowsOnly) {
      setDisplayRows(selectedSamples);
    }
  }, [selectedSamples, showSelectedRowsOnly]);
  // Update CSV export status as data loads
  // CSV export is not permitted until data is FULLY loaded
  // If a load error occurs, we will pass no data to the ExportTableData component
  // However we don't set an error here as we want to see a load error, not CSV download error

  const onColumnToggle = (event: MultiSelectChangeEvent) => {
    const selectedColumns = event.value as Sample[];
    const newColumns = sampleTableColumns.map((col) => {
      const newCol = { ...col };
      newCol.hidden = selectedColumns.some((selectedCol) => selectedCol.field === col.field);
      return newCol;
    });
    setSampleTableColumns(newColumns);
  };

  const toggleShowSelectedRowsOnly = () => {
    setShowSelectedRowsOnly((prev) => !prev);
    if (showSelectedRowsOnly) {
      setDisplayRows(filteredData);
    } else {
      setDisplayRows(selectedSamples);
    }
  };

  const onSelectAllChange = (e: DataTableSelectAllChangeEvent) => {
    const { checked } = e;
    if (checked) {
      setSelectAll(true);
      setSelectedSamples(filteredData);
    } else {
      setSelectAll(false);
      setSelectedSamples([]);
    }
  };

  const header = (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
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
          <Tooltip title="Hide unselected">
            <Button
              variant="outlined"
              disabled={selectedSamples.length === 0}
              color={showSelectedRowsOnly ? 'primary' : 'inherit'}
              onClick={toggleShowSelectedRowsOnly}
              startIcon={showSelectedRowsOnly ? <Visibility /> : <VisibilityOff />}
              size="small"
              style={{ marginLeft: '0.5rem', width: '175px' }} // Add smaller margin
            >
              {showSelectedRowsOnly ? 'Show Unselected' : 'Hide Unselected'}
            </Button>
          </Tooltip>
        </div>
        <ExportTableData
          dataToExport={displayRows}
          disabled={metadataLoadingState !== MetadataLoadingState.DATA_LOADED}
        />
      </div>
    </div>
  );

  return (
    <>
      <DataFilters
        dataLength={tableMetadata.length ?? 0}
        filteredDataLength={filteredDataLength}
        visibleFields={sampleTableColumns}
        allFields={displayFields}
        setPrimeReactFilters={setCurrentFilter}
        filterList={filterList}
        setFilterList={setFilterList}
        isOpen={isDataFiltersOpen}
        setIsOpen={setIsDataFiltersOpen}
        setLoadingState={setLoading}
      />
      <Paper>
        <div>
          <DataTable
            value={displayRows ?? []}
            onValueChange={(e) => {
              setFilteredDataLength(e.length);
              setLoading(false);
              setFilteredData(e);
            }}
            dataKey="Seq_ID"
            size="small"
            removableSort
            showGridlines
            filters={currentFilter}
            scrollable
            scrollHeight="calc(100vh - 300px)"
            paginator
            rows={10}
            resizableColumns
            columnResizeMode="expand"
            rowsPerPageOptions={[10, 50, 100, 500]}
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
