import React, {
  memo, useEffect, useState,
} from 'react';

import { Close } from '@mui/icons-material';
import {
  IconButton,
  CircularProgress, Dialog,
  Backdrop, Alert, AlertTitle, Paper,
} from '@mui/material';
import { DataTable, DataTableRowClickEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Sample } from '../../types/sample.interface';
import LoadingState from '../../constants/loadingState';
import { buildPrimeReactColumnDefinitions } from '../../utilities/tableUtils';
import { SAMPLE_ID_FIELD } from '../../constants/metadataConsts';
import { useApi } from '../../app/ApiContext';
import sortIcon from '../TableComponents/SortIcon';
import ColumnVisibilityMenu from '../TableComponents/ColumnVisibilityMenu';
import ExportTableData from '../Common/ExportTableData';
import DataFilters, { defaultState } from '../DataFilters/DataFilters';
import { useAppDispatch, useAppSelector } from '../../app/store';
import {
  fetchGroupMetadata,
  GroupMetadataState,
  selectAwaitingGroupMetadata,
  selectGroupMetadata,
} from '../../app/groupMetadataSlice';
import MetadataLoadingState from '../../constants/metadataLoadingState';
import { useStateFromSearchParamsForFilterObject } from '../../utilities/stateUtils';
import { useStableNavigate } from '../../app/NavigationContext';

interface SamplesProps {
  groupContext: number | undefined,
  groupContextName: string | undefined,
}

function OrgSamplesTable(props: SamplesProps) {
  const { groupContext, groupContextName } = props;
  const { navigate } = useStableNavigate();
  const [sampleTableColumns, setSampleTableColumns] = useState<any>([]);
  const [filteredSampleList, setFilteredSampleList] = useState<Sample[]>([]);
  const [filtering, setFiltering] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [exportCSVStatus, setExportCSVStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [currentFilters, setCurrentFilters] = useStateFromSearchParamsForFilterObject(
    'filters',
    defaultState,
    navigate,
  );
  const [allFieldsLoaded, setAllFieldsLoaded] = useState<boolean>(false);

  const dispatch = useAppDispatch();

  const { token, tokenLoading } = useApi();
  const metadata: GroupMetadataState | null =
      useAppSelector(state => selectGroupMetadata(state, groupContext));
  const isSamplesLoading : boolean = useAppSelector((state) =>
    selectAwaitingGroupMetadata(state, groupContext));

  useEffect(() => {
    if (groupContext !== undefined &&
      tokenLoading !== LoadingState.LOADING &&
      tokenLoading !== LoadingState.IDLE) {
      setAllFieldsLoaded(false);
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
    if (Object.values(metadata.columnLoadingStates)
      .every(field => field === LoadingState.SUCCESS)) {
      setAllFieldsLoaded(true);
    }
  }, [metadata?.columnLoadingStates, metadata?.fields]);

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

  useEffect(() => {
    if (metadata?.loadingState === MetadataLoadingState.DATA_LOADED) {
      setFilteredSampleList(metadata?.metadata!);
    }
  }, [metadata?.loadingState, metadata?.metadata]);

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
          emptyColumnNames={metadata?.emptyColumns ?? null}
        />
        <ExportTableData
          dataToExport={
            metadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR
              ? []
              : filteredSampleList ?? []
          }
          disabled={metadata?.loadingState !== MetadataLoadingState.DATA_LOADED}
          fileNamePrefix={groupContextName}
        />
      </div>
    </div>
  );

  const renderErrorDialog = () => (
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
            {metadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR
              ? 'Organisation metadata could not be fully loaded'
              : 'Organisation metadata could not be loaded'}
          </strong>
        </AlertTitle>
        {metadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR
          ? `An error occurred loading organisation metadata. Some fields will be null, and 
             CSV export will not be available. Refresh to reload.`
          : 'An error occurred loading organisation metadata. Refresh to reload.'}
        <br />
        Please contact the
        {' '}
        {import.meta.env.VITE_BRANDING_NAME}
        {' '}
        team if this error persists.
      </Alert>
    </Dialog>
  );

  return (
    <div className="datatable-container-org">
      <Backdrop
        sx={{ color: 'var(--background-colour)', zIndex: 2000 }} // TODO: Find a better way to set index higher then top menu
        open={exportCSVStatus === LoadingState.LOADING}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      {renderErrorDialog()}
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
          Please try again later, or contact the
          {' '}
          {import.meta.env.VITE_BRANDING_NAME}
          {' '}
          team.
        </Alert>
      </Dialog>
      <DataFilters
        dataLength={metadata?.metadata?.length ?? 0}
        filteredDataLength={filteredSampleList.length}
        visibleFields={sampleTableColumns}
        allFields={metadata?.fields ?? []} // want to pass in field loading states?
        fieldUniqueValues={metadata?.fieldUniqueValues ?? null}
        setPrimeReactFilters={setCurrentFilters}
        primeReactFilters={currentFilters}
        isOpen={isFiltersOpen}
        setIsOpen={setIsFiltersOpen}
        setLoadingState={setFiltering}
        dataLoaded={allFieldsLoaded}
      />
      <Paper elevation={2} sx={{ marginBottom: 1, flex: 1, minHeight: 0 }}>
        <DataTable
          value={metadata?.metadata ?? []}
          onValueChange={(e) => {
            setFilteredSampleList(e);
          }}
          filters={allFieldsLoaded ? currentFilters : defaultState}
          size="small"
          columnResizeMode="expand"
          resizableColumns
          showGridlines
          reorderableColumns
          removableSort
          header={header}
          scrollable
          scrollHeight="flex"
          sortIcon={sortIcon}
          paginator
          onRowClick={rowClickHandler}
          selectionMode="single"
          rows={25}
          loading={filtering || isSamplesLoading}
          rowsPerPageOptions={[25, 50, 100, 500, 2000]}
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink JumpToPageDropDown"
          currentPageReportTemplate=" Viewing: {first} to {last} of {totalRecords}"
          paginatorPosition="bottom"
          paginatorRight
          className="my-flexible-table"
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
              className="flexible-column"
              bodyClassName="value-cells"
            />
          ))}
        </DataTable>
      </Paper>
    </div>
  );
}

export default memo(OrgSamplesTable);
