/* eslint-disable no-nested-ternary */
import React, { useEffect, useState } from 'react';
import { IconButton, Paper, Skeleton, Tooltip } from '@mui/material';
import { DataTable, DataTableFilterMeta, DataTableSelectAllChangeEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { TextRotateUp, TextRotateVertical, Visibility, VisibilityOffOutlined } from '@mui/icons-material';
import { ProjectViewField } from '../../types/dtos';
import { buildPrimeReactColumnDefinitions } from '../../utilities/tableUtils';
import DataFilters, { DataFilter } from '../DataFilters/DataFilters';
import ExportTableData from '../Common/ExportTableData';
import LoadingState from '../../constants/loadingState';
import MetadataLoadingState from '../../constants/metadataLoadingState';
import { Sample } from '../../types/sample.interface';
import useMaxHeaderHeight from '../TableComponents/UseMaxHeight';
import ColumnVisibilityMenu from '../TableComponents/ColumnVisibilityMenu';
import sortIcon from '../TableComponents/SortIcon';

interface TreeTableProps {
  selectedIds: string[],
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>,
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
  const [verticalHeaders, setVerticalHeaders] = useState<boolean>(false);

  const { maxHeight, getHeaderRef } =
    useMaxHeaderHeight(metadataLoadingState ?? MetadataLoadingState.IDLE);

  // Format display fields into column headers
  useEffect(() => {
    const formatTableHeaders = () => {
      const columnBuilder = buildPrimeReactColumnDefinitions(displayFields);
      setSampleTableColumns(columnBuilder);
      setColumnError(false);
    };

    if (!columnError) {
      formatTableHeaders();
    }
  }, [columnError, displayFields]);

  useEffect(() => {
    const processTableValues = () => {
      setLoading(false);
      setAllIds(tableMetadata.map((sample: any) => sample.Seq_ID));
      setFormattedData(tableMetadata);
      setFilteredData(tableMetadata);
      setFilteredDataLength(tableMetadata.length);
      setDisplayRows(tableMetadata);
    };

    if (metadataLoadingState === MetadataLoadingState.IDLE ||
      metadataLoadingState === MetadataLoadingState.AWAITING_FIELDS ||
      metadataLoadingState === MetadataLoadingState.AWAITING_DATA) {
      setLoading(true);
      return;
    }

    if (Object.keys(currentFilter).length === 0) {
      processTableValues();
    }
  }, [tableMetadata, displayFields, metadataLoadingState, currentFilter]);

  useEffect(() => {
    if (selectAll && Object.keys(currentFilter).length === 0) {
      setSelectedIds(allIds);
    } else if (selectAll && Object.keys(currentFilter).length > 0) {
      setSelectedIds(filteredData.map((sample: any) => sample.Seq_ID));
    }
  }, [allIds, currentFilter, filteredData, selectAll, setSelectedIds]);

  useEffect(() => {
    setSelectedSamples(formattedData.filter((sample: any) => selectedIds.includes(sample.Seq_ID)));
  }, [formattedData, selectedIds]);

  useEffect(() => {
    if (showSelectedRowsOnly) {
      setDisplayRows(selectedSamples);
    } else {
      setDisplayRows(filteredData);
    }
  }, [selectedSamples, filteredData, showSelectedRowsOnly]);

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
      setSelectedSamples(formattedData); // Use memoized version
    } else {
      setSelectAll(false);
      setSelectedSamples([]);
      setSelectedIds([]);
    }
  };

  const header = (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Tooltip title={showSelectedRowsOnly ? 'Show Unselected' : 'Hide Unselected'} placement="top">
          <IconButton
            onClick={toggleShowSelectedRowsOnly}
            color={showSelectedRowsOnly ? 'success' : 'default'}
            disabled={selectedSamples.length === 0}
            size="small"
            style={{ marginLeft: '0.5rem' }}
          >
            {showSelectedRowsOnly ? <Visibility /> : <VisibilityOffOutlined />}
          </IconButton>
        </Tooltip>
        <div style={{ display: 'flex', justifyContent: 'flex end' }}>
          <ColumnVisibilityMenu
            columns={sampleTableColumns}
            onColumnVisibilityChange={(selectedCols) => {
              const newColumns = sampleTableColumns.map((col: any) => {
                const newCol = { ...col };
                newCol.hidden = selectedCols.some(
                  (selectedCol: any) => selectedCol.field === col.field,
                );
                return newCol;
              });
              setSampleTableColumns(newColumns);
            }}
          />
          <Tooltip title="Toggle Vertical Headers" placement="top">
            <IconButton
              onClick={() => setVerticalHeaders(!verticalHeaders)}
              aria-label="toggle vertical headers"
            >
              {verticalHeaders ? (<TextRotateVertical />) : (<TextRotateUp />)}
            </IconButton>
          </Tooltip>
          <ExportTableData
            dataToExport={filteredData}
            disabled={metadataLoadingState !== MetadataLoadingState.DATA_LOADED}
          />
        </div>
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
      <Paper elevation={2} sx={{ marginBottom: 10 }}>
        <div>
          <DataTable
            value={displayRows ?? []}
            onValueChange={(e) => {
              setFilteredDataLength(e.length);
              setLoading(false);
              setFilteredData(e);
            }}
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
            paginatorRight
            loading={loading}
            header={header}
            reorderableColumns
            selectionMode="multiple"
            selection={selectedSamples}
            selectAll={selectAll}
            onSelectAllChange={onSelectAllChange}
            onSelectionChange={(e: any) => {
              setSelectedSamples(e.value as Sample[]);
              setSelectedIds(e.value.map((sample: any) => sample.Seq_ID));
            }}
            sortIcon={sortIcon}
          >
            <Column selectionMode="multiple" style={{ width: '3em' }} />
            {sampleTableColumns.map((col: Sample, index: any) => (
              <Column
                key={col.field}
                field={col.field}
                header={(
                  !verticalHeaders ? <div>{col.header}</div> : (
                    <div ref={(ref) => getHeaderRef(ref, index)} className="custom-header">
                      {col.header}
                    </div>
                  )
                )}
                body={BodyComponent({ col, readyFields: fieldLoadingState })}
                hidden={col.hidden}
                sortable
                resizeable
                headerStyle={verticalHeaders ? { maxHeight: `${maxHeight}px`, width: `${maxHeight}px` } : { width: `${maxHeight}px` }}
                headerClassName="custom-title"
              />
            ))}
          </DataTable>
        </div>
      </Paper>
    </>
  );
}
