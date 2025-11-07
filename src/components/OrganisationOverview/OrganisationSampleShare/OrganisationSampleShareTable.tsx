import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, DataTableSelectAllChangeEvent, DataTableSelectionMultipleChangeEvent } from 'primereact/datatable';
import { IconButton, Paper, Skeleton, Tooltip } from '@mui/material';
import { TextRotateUp, TextRotateVertical, Visibility, VisibilityOffOutlined } from '@mui/icons-material';
import { Column } from 'primereact/column';
import { MetaDataColumn } from '../../../types/dtos';
import LoadingState from '../../../constants/loadingState';
import MetadataLoadingState from '../../../constants/metadataLoadingState';
import { Sample } from '../../../types/sample.interface';
import { useStateFromSearchParamsForFilterObject } from '../../../utilities/stateUtils';
import DataFilters, { defaultState } from '../../DataFilters/DataFilters';
import useMaxHeaderHeight from '../../TableComponents/UseMaxHeight';
import { buildPrimeReactColumnDefinitions } from '../../../utilities/tableUtils';
import { isDataTableFiltersEqual } from '../../../utilities/filterUtils';
import ColumnVisibilityMenu from '../../TableComponents/ColumnVisibilityMenu';
import sortIcon from '../../TableComponents/SortIcon';

interface OrgSampleShareTableProps {
  displayFields: MetaDataColumn[],
  uniqueValues: Record<string, string[] | null> | null,
  emptyColumns: string[],
  fieldLoadingState: Record<string, LoadingState>,
  metadataLoadingState: MetadataLoadingState,
  selectedIds: string[],
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>,
  tableMetadata: Sample[],
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

export default function OrganisationSampleShareTable(props: OrgSampleShareTableProps) {
  const {
    displayFields,
    uniqueValues,
    emptyColumns,
    fieldLoadingState,
    metadataLoadingState,
    selectedIds,
    setSelectedIds,
    tableMetadata,
  } = props;

  const navigate = useNavigate();
  const [formattedData, setFormattedData] = useState<Sample[]>([]);
  const [sampleTableColumns, setSampleTableColumns] = useState<Sample[]>([]);
  const [columnError, setColumnError] = useState(false);
  const [displayRows, setDisplayRows] = useState<Sample[]>([]);
  const [selectedSamples, setSelectedSamples] = useState<Sample[]>([]);
  const [filteredData, setFilteredData] = useState<Sample[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [allIds, setAllIds] = useState<string[]>([]);
  const [isDataFiltersOpen, setIsDataFiltersOpen] = useState(true);
  const [currentFilters, setCurrentFilters] = useStateFromSearchParamsForFilterObject(
    'filters',
    defaultState,
    navigate,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [filteredDataLength, setFilteredDataLength] = useState<number>(tableMetadata.length ?? 0);
  const [showSelectedRowsOnly, setShowSelectedRowsOnly] = useState(false);
  const [verticalHeaders, setVerticalHeaders] = useState<boolean>(false);
  const [allFieldsLoaded, setAllFieldsLoaded] = useState<boolean>(false);

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
      // The data is loaded
      setLoading(false);
      setFilteredDataLength(tableMetadata.length);
      setFormattedData(tableMetadata);
      setFilteredData(tableMetadata);
      setDisplayRows(tableMetadata);
    };

    if (metadataLoadingState === MetadataLoadingState.IDLE ||
        metadataLoadingState === MetadataLoadingState.AWAITING_FIELDS ||
        metadataLoadingState === MetadataLoadingState.AWAITING_DATA) {
      setLoading(true);
      return;
    }
    if (Object.keys(currentFilters).length === 0 ||
        isDataTableFiltersEqual(currentFilters, defaultState)) {
      processTableValues();
    }
  }, [currentFilters, metadataLoadingState, tableMetadata]);

  useEffect(() => {
    if (fieldLoadingState && displayRows.length > 0) {
      if (Object.values(fieldLoadingState)
        .every(field => field === LoadingState.SUCCESS)) {
        setAllFieldsLoaded(true);
        setAllIds(tableMetadata.map((sample: any) => sample.Seq_ID));
      }
    }
  }, [displayRows.length, fieldLoadingState, tableMetadata]);

  useEffect(() => {
    if (selectAll && Object.keys(currentFilters).length === 0) {
      setSelectedIds(allIds);
    } else if (selectAll && Object.keys(currentFilters).length > 0) {
      setSelectedIds(filteredData.map((sample: any) => sample.Seq_ID));
    }
  }, [allIds, currentFilters, filteredData, selectAll, setSelectedIds]);

  useEffect(() => {
    setSelectedSamples(formattedData.filter((sample: any) => selectedIds.includes(sample.Seq_ID)));
  }, [formattedData, selectedIds]);

  useEffect(() => {
    if (showSelectedRowsOnly && selectedSamples.length > 0) {
      setDisplayRows(selectedSamples);
    } else if (metadataLoadingState === MetadataLoadingState.DATA_LOADED) {
      setShowSelectedRowsOnly(false);
      setDisplayRows(tableMetadata);
    }
  }, [selectedSamples, filteredData, showSelectedRowsOnly,
    tableMetadata, metadataLoadingState]);

  const toggleShowSelectedRowsOnly = () => {
    setShowSelectedRowsOnly((prev) => !prev);
    if (showSelectedRowsOnly) {
      setDisplayRows(tableMetadata);
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
            emptyColumnNames={emptyColumns}
          />
          <Tooltip title="Toggle Vertical Headers" placement="top">
            <IconButton
              onClick={() => setVerticalHeaders(!verticalHeaders)}
              aria-label="toggle vertical headers"
            >
              {verticalHeaders ? (<TextRotateVertical />) : (<TextRotateUp />)}
            </IconButton>
          </Tooltip>
        </div>
      </div>
    </div>
  );

  if (metadataLoadingState !== MetadataLoadingState.DATA_LOADED) {
    return (<Skeleton />);
  }

  return (
    <>
      <DataFilters
        dataLength={tableMetadata.length ?? 0}
        filteredDataLength={filteredDataLength}
        visibleFields={sampleTableColumns}
        allFields={displayFields}
        fieldUniqueValues={uniqueValues}
        setPrimeReactFilters={setCurrentFilters}
        primeReactFilters={currentFilters}
        isOpen={isDataFiltersOpen}
        setIsOpen={setIsDataFiltersOpen}
        dataLoaded={allFieldsLoaded}
        setLoadingState={setLoading}
      />
      <Paper elevation={2} sx={{ marginBottom: 10 }}>
        <div>
          <DataTable
            value={displayRows}
            onValueChange={(e) => {
              setFilteredDataLength(e.length);
              setLoading(false);
              setFilteredData(e);
              setFormattedData(e);
            }}
            size="small"
            removableSort
            showGridlines
            filters={allFieldsLoaded ?
              currentFilters : defaultState}
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
            paginatorRight
            loading={!allFieldsLoaded || loading}
            header={header}
            reorderableColumns
            selectionMode="multiple"
            selection={selectedSamples}
            selectAll={selectAll}
            onSelectAllChange={onSelectAllChange}
            onSelectionChange={(e: DataTableSelectionMultipleChangeEvent<Sample[]>) => {
              setSelectedSamples(e.value as Sample[]);
              setSelectedIds(e.value.map((sample: any) => sample.Seq_ID));
            }}
            sortIcon={sortIcon}
            className={verticalHeaders ? 'vertical-table-mode' : undefined}
          >
            <Column selectionMode="multiple" style={{ width: '3em' }} />
            {sampleTableColumns.map((col: Sample, index: any) => (
              <Column
                key={col.field}
                field={col.field}
                header={(
                          !verticalHeaders ? <div>{col.header}</div> : (
                            <div ref={(ref) => getHeaderRef(ref, index)} className="custom-vertical-header">
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
