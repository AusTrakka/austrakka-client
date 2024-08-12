import React, {
  memo, useEffect, useRef, useState,
} from 'react';

import { Close } from '@mui/icons-material';
import {
  IconButton,
  CircularProgress, Dialog,
  Backdrop, Alert, AlertTitle, Paper,
} from '@mui/material';
import { CSVLink } from 'react-csv';
import { useNavigate } from 'react-router-dom';

import { DataTable, DataTableRowClickEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Sample } from '../../types/sample.interface';
import LoadingState from '../../constants/loadingState';
import { convertDataTableFilterMetaToDataFilterObject,
  isDataTableFiltersEqual,
  useStateFromSearchParamsForFilterObject } from '../../utilities/helperUtils';
import { buildPrimeReactColumnDefinitions } from '../../utilities/tableUtils';
import { SAMPLE_ID_FIELD } from '../../constants/metadataConsts';
import { useApi } from '../../app/ApiContext';
import sortIcon from '../TableComponents/SortIcon';
import ColumnVisibilityMenu from '../TableComponents/ColumnVisibilityMenu';
import ExportTableData from '../Common/ExportTableData';
import DataFilters, { DataFilter, defaultState } from '../DataFilters/DataFilters';
import {
  fetchGroupMetadata,
  GroupMetadataState,
  selectGroupMetadata,
  selectAwaitingGroupMetadata,
} from '../../app/groupMetadataSlice';
import { useAppDispatch, useAppSelector } from '../../app/store';
import MetadataLoadingState from '../../constants/metadataLoadingState';

interface SamplesProps {
  groupContext: number | undefined,
}
// SAMPLE TABLE
// Transitionary sampel table component that contains repeat code from both
//    - ProjectOverview.tsx and,
//    - Samples.tsx
// Takes groupContext as input and:
// 1. Gets display fields for that group to a) builds columns and b) order columns
// 2. Gets sample list (paginated, filtered + sorted) for display in table
// 3. Gets sample list (unpaginated, filtered + sorted) for csv export

function SampleTable(props: SamplesProps) {
  const { groupContext } = props;
  const csvLink = useRef<CSVLink & HTMLAnchorElement & { link: HTMLAnchorElement }>(null);
  const [sampleTableColumns, setSampleTableColumns] = useState<any>([]);
  const [filteredSampleList, setFilteredSampleList] = useState<Sample[]>([]);
  const [filtering, setFiltering] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [filterList, setFilterList] = useState<DataFilter[]>([]);
  const [exportCSVStatus, setExportCSVStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [exportData, setExportData] = useState<Sample[]>([]);
  const [initialisingFilters, setInitialisingFilters] = useState(true);
  const [currentFilters, setCurrentFilters] = useStateFromSearchParamsForFilterObject(
    'filters',
    defaultState,
  );

  const dispatch = useAppDispatch();

  const { token, tokenLoading } = useApi();
  const navigate = useNavigate();
  const metadata: GroupMetadataState | null =
      useAppSelector(state => selectGroupMetadata(state, groupContext));
  const isSamplesLoading : boolean = useAppSelector((state) =>
    selectAwaitingGroupMetadata(state, groupContext));

  useEffect(() => {
    const initialFilterState = () => {
      if (!isDataTableFiltersEqual(currentFilters, defaultState)) {
        setFilterList(convertDataTableFilterMetaToDataFilterObject(
          currentFilters,
          metadata?.fields!,
        ));
      } else {
        setFilterList([]);
      }
      setInitialisingFilters(false);
    };
    if (metadata?.fields && initialisingFilters &&
        metadata?.loadingState === MetadataLoadingState.DATA_LOADED) {
      initialFilterState();
    }
  }, [currentFilters, initialisingFilters, metadata?.fields, metadata?.loadingState]);

  useEffect(() => {
    if (groupContext !== undefined &&
      tokenLoading !== LoadingState.LOADING &&
      tokenLoading !== LoadingState.IDLE) {
      // fetchSamplesData();
      dispatch(fetchGroupMetadata({ groupId: groupContext!, token }));
    }
  }, [groupContext, token, tokenLoading, dispatch]);

  useEffect(() => {
    if (metadata?.loadingState === MetadataLoadingState.ERROR ||
        metadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR) {
      setErrorDialogOpen(true);
    }
  }, [metadata?.loadingState]);

  useEffect(() => {
    // BUILD COLUMNS
    if (!metadata?.fields || !metadata?.columnLoadingStates) return;
    const columnBuilder = buildPrimeReactColumnDefinitions(metadata.fields);
    setSampleTableColumns(columnBuilder);
  }, [metadata?.columnLoadingStates, metadata?.fields]);

  useEffect(
    () => {
      if (exportData.length > 0 && exportCSVStatus === LoadingState.LOADING) {
        try {
          csvLink?.current?.link.click();
          setExportCSVStatus(LoadingState.IDLE);
          setExportData([]);
        } catch (error) {
          setExportCSVStatus(LoadingState.ERROR);
          setExportData([]);
        }
      }
    },
    [exportCSVStatus, exportData, sampleTableColumns, setExportCSVStatus, setExportData],
  );

  const rowClickHandler = (row: DataTableRowClickEvent) => {
    const selectedRow = row.data;
    if (SAMPLE_ID_FIELD in selectedRow) {
      const sampleId = selectedRow[SAMPLE_ID_FIELD];
      const url = `/records/${sampleId}`;
      navigate(url);
    } else {
      // eslint-disable-next-line no-console
      console.error(`${SAMPLE_ID_FIELD} not found in selectedRow.`);
    }
  };

  const handleDialogClose = () => {
    setExportCSVStatus(LoadingState.IDLE);
  };

  const header = (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
        <ExportTableData
          dataToExport={filteredSampleList}
          disabled={false}
        />
      </div>
    </div>
  );

  if (initialisingFilters || isSamplesLoading) { return null; }
  return (
    <>
      <Backdrop
        sx={{ color: '#fff', zIndex: 2000 }} // TODO: Find a better way to set index higher then top menu
        open={exportCSVStatus === LoadingState.LOADING}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Dialog open={errorDialogOpen} onClose={() => setErrorDialogOpen(false)}>
        <Alert severity="error" sx={{ padding: 3 }}>
          <IconButton aria-label="close" onClick={() => setErrorDialogOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            {' '}
            <Close />
            {' '}
          </IconButton>
          {' '}
          <AlertTitle sx={{ paddingBottom: 1 }}>
            {' '}
            <strong>
              {' '}
              {metadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR ?
                'Project metadata could not be fully loaded' :
                'Project metadata could not be loaded'}
              {' '}
            </strong>
            {' '}
          </AlertTitle>
          {' '}
          {metadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR ?
            `An error occured loading project metadata. Some fields will be null, and 
          CSV export will not be available. Refresh to reload.` :
            'An error occured loading project metadata. Refresh to reload.'}
          <br />
          Please contact an AusTrakka admin if this error persists.
        </Alert>
      </Dialog>
      <Dialog onClose={handleDialogClose} open={exportCSVStatus === LoadingState.ERROR}>
        <Alert severity="error" sx={{ padding: 3 }}>
          <IconButton
            aria-label="close"
            onClick={handleDialogClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
          <AlertTitle sx={{ paddingBottom: 1 }}>
            <strong>Your data could not be exported to CSV.</strong>
          </AlertTitle>
          There has been an error exporting your data to CSV.
          <br />
          Please try again later, or contact an AusTrakka admin.
        </Alert>
      </Dialog>
      <DataFilters
        dataLength={metadata?.metadata?.length ?? 0}
        filteredDataLength={filteredSampleList.length}
        visibleFields={sampleTableColumns}
        allFields={metadata?.fields ?? []} // want to pass in field loading states?
        setPrimeReactFilters={setCurrentFilters}
        isOpen={isFiltersOpen}
        setIsOpen={setIsFiltersOpen}
        filterList={filterList}
        setFilterList={setFilterList}
        setLoadingState={setFiltering}
      />
      <Paper elevation={2} sx={{ marginBottom: 10 }}>
        <DataTable
          value={metadata?.metadata ?? []}
          onValueChange={(e) => {
            setFilteredSampleList(e);
          }}
          filters={currentFilters}
          size="small"
          columnResizeMode="expand"
          resizableColumns
          showGridlines
          reorderableColumns
          removableSort
          header={header}
          scrollable
          scrollHeight="calc(100vh - 300px)"
          sortIcon={sortIcon}
          paginator
          onRowClick={rowClickHandler}
          selectionMode="single"
          rows={25}
          loading={filtering}
          rowsPerPageOptions={[25, 50, 100, 500]}
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink JumpToPageDropDown"
          currentPageReportTemplate=" Viewing: {first} to {last} of {totalRecords}"
          paginatorPosition="bottom"
          paginatorRight
        >
          {sampleTableColumns.map((col: any) => (
            <Column
              key={col.field}
              field={col.field}
              header={col.header}
              body={col.body}
              hidden={col.hidden ?? false}
              sortable
              resizeable
              style={{ minWidth: '150px' }}
              headerClassName="custom-title"
            />
          ))}
        </DataTable>
      </Paper>
    </>
  );
}
export default memo(SampleTable);
