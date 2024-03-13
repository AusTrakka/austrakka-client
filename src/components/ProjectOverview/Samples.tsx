/* eslint-disable react/jsx-pascal-case */
import 'primereact/resources/themes/saga-green/theme.css';
import React, {
  memo, useEffect, useState,
} from 'react';
import { Close } from '@mui/icons-material';
import { DataTable, DataTableRowClickEvent, DataTableFilterMeta } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { MultiSelect, MultiSelectChangeEvent } from 'primereact/multiselect';
import {
  IconButton,
  Dialog,
  Alert, AlertTitle, Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from 'primereact/skeleton';
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
  isSamplesLoading: boolean,
  inputFilters: DataFilter[] | null,
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
    isSamplesLoading,
    inputFilters,
  } = props;
  const navigate = useNavigate();
  const [sampleTableColumns, setSampleTableColumns] = useState<any>([]);
  const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);
  const [currentFilters, setCurrentFilters] = useState<DataTableFilterMeta>({});
  const [filteredData, setFilteredData] = useState<Sample[]>([]);
  const [isDataFiltersOpen, setIsDataFiltersOpen] = useState(true);
  const [filterList, setFilterList] = useState<DataFilter[]>(inputFilters ?? []);
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
    setReadyFields(metadata!.fieldLoadingStates);
    setFilteredDataLength(metadata!.metadata?.length ?? 0);
    setSampleTableColumns(columnBuilder);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metadata?.fields, metadata?.fieldLoadingStates]);

  useEffect(() => {
    if (metadata?.loadingState === MetadataLoadingState.DATA_LOADED) {
      setFilteredData(metadata?.metadata!);
    }
  }, [metadata?.loadingState, metadata?.metadata]);

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

  const onColumnToggle = (event: MultiSelectChangeEvent) => {
    setLoadingState(true);
    const selectedColumns = event.value as Sample[];
    const newColumns = sampleTableColumns.map((col: any) => {
      const newCol = { ...col };
      newCol.hidden = selectedColumns.some((selectedCol) => selectedCol.field === col.field);
      return newCol;
    });
    setSampleTableColumns(newColumns);
    setLoadingState(false);
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
          dataToExport={
                  metadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR ?
                    [] : filteredData ?? []
                }
          disabled={metadata?.loadingState !== MetadataLoadingState.DATA_LOADED}
        />
      </div>
    </div>
  );

  if (isSamplesLoading) return null;

  return (
    <>
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
        visibleFields={sampleTableColumns}
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
            onValueChange={(e) => {
              setFilteredDataLength(e.length);
              setLoadingState(false);
              setFilteredData(e);
            }}
            size="small"
            removableSort
            showGridlines
            scrollable
            scrollHeight="calc(100vh - 500px)"
            paginator
            loading={loadingState}
            rows={25}
            resizableColumns
            columnResizeMode="expand"
            rowsPerPageOptions={[25, 50, 100, 500]}
            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink JumpToPageDropDown"
            currentPageReportTemplate=" Viewing: {first} to {last} of {totalRecords}"
            paginatorPosition="bottom"
            paginatorRight
            header={header}
            onRowClick={rowClickHandler}
            selectionMode="single"
            filters={currentFilters}
            reorderableColumns
          >
            {sampleTableColumns.map((col: any) => (
              <Column
                key={col.field}
                field={col.field}
                header={col.header}
                body={BodyComponent({ col, readyFields })}
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
export default memo(Samples);
