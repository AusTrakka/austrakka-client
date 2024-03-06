/* eslint-disable react/jsx-pascal-case */
import 'primereact/resources/themes/md-light-indigo/theme.css';
import React, {
  memo, useEffect, SetStateAction, useState, useRef,
} from 'react';
import { Close } from '@mui/icons-material';
import { DataTable, DataTableRowClickEvent, DataTableFilterMeta, DataTableStateEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { MultiSelect, MultiSelectChangeEvent } from 'primereact/multiselect';
import {
  IconButton,
  CircularProgress, Dialog,
  Backdrop, Alert, AlertTitle, Paper, LinearProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from 'primereact/skeleton';
import { PaginatorJumpToPageInputOptions } from 'primereact/paginator';
import { InputText } from 'primereact/inputtext';
import LoadingState from '../../constants/loadingState';
import { SAMPLE_ID_FIELD } from '../../constants/metadataConsts';
import DataFilters, { DataFilter } from '../DataFilters/DataFilters';
import { ProjectMetadataState, selectProjectMetadata } from '../../app/projectMetadataSlice';
import { buildPrimeReactColumnDefinitions } from '../../utilities/tableUtils';
import MetadataLoadingState from '../../constants/metadataLoadingState';
import ExportTableData from '../Common/ExportTableData';
import { Sample } from '../../types/sample.interface';
import { useAppSelector } from '../../app/store';

interface SamplesProps {
  projectAbbrev: string,
  totalSamples: number,
  isSamplesLoading: boolean,
  inputFilters: SetStateAction<DataFilter[]> | null,
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

function Samples(props: SamplesProps) {
  const {
    projectAbbrev,
    totalSamples,
    isSamplesLoading,
    inputFilters,
  } = props;
  const navigate = useNavigate();
  const dt = useRef<DataTable<Sample[]>>(null);

  const [sampleTableColumns, setSampleTableColumns] = useState<Sample[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Sample[]>([]);
  const [exportCSVStatus, setExportCSVStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<DataTableFilterMeta>({});
  const [isDataFiltersOpen, setIsDataFiltersOpen] = useState(true);
  const [filterList, setFilterList] = useState<DataFilter[]>([]);
  const [readyFields, setReadyFields] = useState<Record<string, LoadingState>>({});
  const [loadingState, setLoadingState] = useState<boolean>(false);
  const [filteredDataLength, setFilteredDataLength] =
    useState<number>(0);

  const metadata : ProjectMetadataState | null =
    useAppSelector(state => selectProjectMetadata(state, projectAbbrev));

  // Set column headers from metadata state
  useEffect(() => {
    if (!metadata?.fields) return;
    const columnBuilder = buildPrimeReactColumnDefinitions(metadata!.fields!);
    console.log('columnBuilder', columnBuilder);
    setReadyFields(metadata!.fieldLoadingStates);
    setFilteredDataLength(metadata!.metadata?.length ?? 0);
    setSampleTableColumns(columnBuilder);
    setVisibleColumns(columnBuilder);
    console.log(metadata?.metadata);
  }, [metadata]);

  // Open error dialog if loading state changes to error
  useEffect(() => {
    if (metadata?.loadingState === MetadataLoadingState.ERROR ||
        metadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR) {
      setErrorDialogOpen(true);
    }
  }, [metadata?.loadingState]);

  const rowClickHandler = (event: DataTableRowClickEvent) => {
    const selectedRow = event.data as Sample;
    if (SAMPLE_ID_FIELD in selectedRow) {
      navigate(`/projects/${projectAbbrev}/records/${selectedRow[SAMPLE_ID_FIELD]}`);
    }
  };

  // Update CSV export status as data loads
  // CSV export is not permitted until data is FULLY loaded
  // If a load error occurs, we will pass no data to the ExportTableData component
  // However we don't set an error here as we want to see a load error, not CSV download error
  useEffect(() => {
    setExportCSVStatus(
      isSamplesLoading ||
      metadata?.loadingState === MetadataLoadingState.IDLE ||
      metadata?.loadingState === MetadataLoadingState.AWAITING_DATA ||
      metadata?.loadingState === MetadataLoadingState.PARTIAL_DATA_LOADED ?
        LoadingState.LOADING :
        LoadingState.SUCCESS,
    );
  }, [isSamplesLoading, metadata?.loadingState]);

  const onColumnToggle = (event: MultiSelectChangeEvent) => {
    const selectedColumnsToHide = event.value; // Store columns to hide

    const remainderColumns = sampleTableColumns.filter((col) =>
    // Keep columns that are NOT selected for hiding
      !selectedColumnsToHide.some((sCol: Sample) => sCol.field === col.field));

    setVisibleColumns(remainderColumns);
  };

  const totalSamplesDisplay = `Total unfiltered records: ${totalSamples.toLocaleString('en-us')}`;

  const onPageChange = (event: DataTableStateEvent) => {
    console.log('onPageChange', event);
    setFilteredDataLength(event.totalRecords);
  };

  const header = (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <MultiSelect
          value={sampleTableColumns.filter((col) =>
            !visibleColumns.some((vCol) => vCol.field === col.field))}
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
          dataToExport={
                  metadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR ?
                    [] : metadata?.metadata ?? []
                }
          exportCSVStatus={exportCSVStatus}
          setExportCSVStatus={setExportCSVStatus}
        />
      </div>
    </div>
  );

  if (isSamplesLoading) return null;

  return (
    <>
      <Backdrop
        // This Backdrop will not do anything in a tab, where the entire display is suppressed
        sx={{ color: '#fff', zIndex: 2000 }} // TODO: Find a better way to set index higher then top menu
        open={isSamplesLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Dialog open={errorDialogOpen} onClose={() => setErrorDialogOpen(false)}>
        <Alert severity="error" sx={{ padding: 3 }}>
          <IconButton
            aria-label="close"
            onClick={() => setErrorDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
          <AlertTitle sx={{ paddingBottom: 1 }}>
            <strong>
              {metadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR ?
                'Project metadata could not be fully loaded' :
                'Project metadata could not be loaded'}
            </strong>
          </AlertTitle>
          {metadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR ?
            `An error occured loading project metadata. Some fields will be null, and 
          CSV export will not be available. Refresh to reload.` :
            'An error occured loading project metadata. Refresh to reload.'}
          <br />
          Please contact an AusTrakka admin if this error persists.
        </Alert>
      </Dialog>
      <DataFilters
        dataLength={metadata?.metadata?.length ?? 0}
        filteredDataLength={filteredDataLength}
        visibleFields={visibleColumns}
        allFields={metadata?.fields ?? []} // want to pass in field loading states?
        setPrimeReactFilters={setCurrentFilters}
        isOpen={isDataFiltersOpen}
        setIsOpen={setIsDataFiltersOpen}
        filterList={filterList}
        setFilterList={setFilterList}
        setLoadingState={setLoadingState}
      />
      {
      /* TODO: Make a function for the table so that a different sort is used per column type */
      }
      <Paper elevation={2} sx={{ marginBottom: 10 }}>
        <div>
          <DataTable
            value={metadata?.metadata ?? []}
            onPage={onPageChange}
            onValueChange={(e) => { setFilteredDataLength(e.length); setLoadingState(false); }}
            size="small"
            removableSort
            scrollable
            scrollHeight="calc(100vh - 400px)"
            paginator
            loading={loadingState}
            rows={10}
            resizableColumns
            columnResizeMode="expand"
            rowsPerPageOptions={[10, 50, 100, 500]}
            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink JumpToPageDropDown"
            currentPageReportTemplate=" Viewing: {first} to {last} of {totalRecords}"
            paginatorPosition="bottom"
            paginatorLeft
            header={header}
            onRowClick={rowClickHandler}
            selectionMode="single"
            filters={currentFilters}
            reorderableColumns
          >
            {visibleColumns.map((col) => (
              <Column
                key={col.field}
                field={col.field}
                header={col.header}
                body={BodyComponent({ col, readyFields })}
                sortable
                resizeable
              />
            ))}
          </DataTable>
        </div>
      </Paper>
    </>
  );
}
export default memo(Samples);
