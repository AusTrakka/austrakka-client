import React, {
  memo, useEffect, useState,
} from 'react';
import { Close, IosShare, Visibility, VisibilityOffOutlined } from '@mui/icons-material';
import {
  IconButton,
  CircularProgress, Dialog,
  Backdrop, Alert, AlertTitle, Paper,
  Tooltip,
} from '@mui/material';
import { DataTable, DataTableRowClickEvent, DataTableSelectAllChangeEvent, DataTableSelectionMultipleChangeEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Sample } from '../../types/sample.interface';
import LoadingState from '../../constants/loadingState';
import { buildPrimeReactColumnDefinitions, PrimeReactColumnDefinition } from '../../utilities/tableUtils';
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
import OrgSampleShare from './OrgSampleShare/OrgSampleShare';
import { ShareBlocked } from './OrgSampleShare/ShareBlocked';
import { columnStyleRules, combineClasses } from '../../styles/metadataFieldStyles';

interface SamplesProps {
  groupContext: number,
  groupContextName: string | undefined,
  canShare: boolean,
  orgAbbrev: string
}

function OrgSamplesTable(props: SamplesProps) {
  const { groupContext, groupContextName, canShare, orgAbbrev } = props;
  const { navigate } = useStableNavigate();
  const [sampleTableColumns, setSampleTableColumns] = useState<PrimeReactColumnDefinition[]>([]);
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
  const [exportData, setExportData] = useState<Sample[]>([]);
  const [allFieldsLoaded, setAllFieldsLoaded] = useState<boolean>(false);
  // Table row selection/display
  const [selectAll, setSelectAll] = useState(false);
  // const [allIds, setAllIds] = useState<string[]>([]);
  const [displayRows, setDisplayRows] = useState<Sample[]>([]);
  const [showSelectedRowsOnly, setShowSelectedRowsOnly] = useState(false);
  const [selectedSamples, setSelectedSamples] = useState<Sample[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formattedData, setFormattedData] = useState<Sample[]>([]);
  // Sharing samples
  const [showShare, setShowShare] = useState<boolean>(false);
  const [openShareDialog, setOpenShareDialog] = useState<boolean>(false);
  const [shareBlocked, setShareBlocked] = useState(false);
  const [openShareBlocked, setOpenShareBlocked] = useState(false);

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
    // Prevent navigation from selection box column
    if ((row.originalEvent.target as HTMLElement).closest('.p-selection-column')) {
      return;
    }
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
      setFormattedData(metadata?.metadata!);
      setDisplayRows(metadata?.metadata!);
    }
  }, [metadata?.loadingState, metadata?.metadata]);

  const handleDialogClose = () => {
    setExportCSVStatus(LoadingState.IDLE);
  };

  useEffect(() => {
    if (groupContextName?.endsWith('-Owner')) {
      setShowShare(true);
    } else {
      setShowShare(false);
    }
  }, [groupContextName]);

  useEffect(() => {
    if (selectedIds.length === 0 || canShare === false) {
      setShareBlocked(true);
    } else {
      setShareBlocked(false);
    }
  }, [selectedIds, canShare]);

  useEffect(() => {
    if (showSelectedRowsOnly && selectedSamples.length > 0) {
      setDisplayRows(selectedSamples);
    } else if (metadata?.loadingState === MetadataLoadingState.DATA_LOADED) {
      setShowSelectedRowsOnly(false);
      setDisplayRows(metadata?.metadata!);
    }
  }, [selectedSamples, filteredSampleList, showSelectedRowsOnly,
    metadata?.metadata, metadata?.loadingState]);

  const toggleShowSelectedRowsOnly = () => {
    setShowSelectedRowsOnly((prev) => !prev);
    if (showSelectedRowsOnly) {
      setDisplayRows(metadata?.metadata!);
    } else {
      setDisplayRows(selectedSamples);
    }
  };
  
  const onSelectAllChange = (e: DataTableSelectAllChangeEvent) => {
    const { checked } = e;
    if (checked) {
      setSelectAll(true);
      setSelectedSamples(formattedData); // Use memoized version
      setSelectedIds(formattedData.map((sample: any) => sample.Seq_ID));
    } else {
      setSelectAll(false);
      setSelectedSamples([]);
      setSelectedIds([]);
    }
  };

  useEffect(() => {
    setSelectedSamples(formattedData.filter((sample: any) => selectedIds.includes(sample.Seq_ID)));
  }, [formattedData, selectedIds]);

  // Set export data based on filtered vs display data length
  useEffect(() => {
    if (displayRows.length < filteredSampleList.length) {
      setExportData(displayRows);
    } else {
      setExportData(filteredSampleList);
    }
  }, [displayRows, filteredSampleList]);

  const handleShareClick = () => {
    if (shareBlocked) {
      setOpenShareBlocked(true);
    } else {
      setOpenShareDialog(true);
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
          >
            {showSelectedRowsOnly ? <Visibility /> : <VisibilityOffOutlined />}
          </IconButton>
        </Tooltip>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {(showShare ? (
            <Tooltip title="Share samples" placement="top" arrow>
              <IconButton onClick={() => handleShareClick()}>
                <IosShare />
              </IconButton>
            </Tooltip>
          ) : null)}
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
                : exportData
            }
            headers={sampleTableColumns.filter(col => !col.hidden).map(col => col.header)}
            disabled={metadata?.loadingState !== MetadataLoadingState.DATA_LOADED}
            fileNamePrefix={groupContextName || 'org_samples'}
          />
        </div>
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
      {openShareBlocked && (
        <ShareBlocked
          canShare={canShare}
          openShareBlocked={openShareBlocked}
          setOpenShareBlocked={setOpenShareBlocked}
          selectedIdsLength={selectedIds.length}
        />
      )}
      {openShareDialog && (
        <OrgSampleShare
          open={openShareDialog}
          onClose={() => setOpenShareDialog(false)}
          selectedSamples={selectedSamples}
          selectedIds={selectedIds}
          orgAbbrev={orgAbbrev}
          groupContext={groupContext}
        />
      )}
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
          value={displayRows}
          onValueChange={(e) => {
            setFilteredSampleList(e);
            setFormattedData(e);
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
          selectionMode="multiple"
          rows={25}
          loading={filtering || isSamplesLoading}
          rowsPerPageOptions={[25, 50, 100, 500, 2000]}
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink JumpToPageDropDown"
          currentPageReportTemplate=" Viewing: {first} to {last} of {totalRecords}"
          paginatorPosition="bottom"
          paginatorRight
          className="my-flexible-table"
          selection={selectedSamples}
          selectAll={selectAll}
          onSelectAllChange={onSelectAllChange}
          onSelectionChange={(e: DataTableSelectionMultipleChangeEvent<Sample[]>) => {
            setSelectedSamples(e.value as Sample[]);
            setSelectedIds(e.value.map((sample: any) => sample.Seq_ID));
          }}
        >
          <Column selectionMode="multiple" style={{ width: '3em' }} />
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
              bodyClassName={combineClasses('value-cells', columnStyleRules[col.field])}
            />
          ))}
        </DataTable>
      </Paper>
    </div>
  );
}

export default memo(OrgSamplesTable);
