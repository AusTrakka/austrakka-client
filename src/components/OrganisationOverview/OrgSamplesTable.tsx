import {
  Close,
  IosShare,
  RemoveCircleOutline,
  Settings,
  SwapHorizontalCircle,
  Visibility,
  VisibilityOffOutlined,
} from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Backdrop,
  Box,
  CircularProgress,
  Dialog,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  MenuList,
  Paper,
  Tooltip,
} from '@mui/material';
import { Column } from 'primereact/column';
import {
  DataTable,
  type DataTableRowClickEvent,
  type DataTableSelectAllChangeEvent,
  type DataTableSelectionMultipleChangeEvent,
} from 'primereact/datatable';
import { memo, useEffect, useMemo, useState } from 'react';
import { useStableNavigate } from '../../app/NavigationContext';
import {
  type OrgMetadataState,
  selectAwaitingOrgMetadata,
  selectOrgMetadata,
} from '../../app/orgMetadataSlice';
import { useAppSelector } from '../../app/store';
import { Theme } from '../../assets/themes/theme';
import LoadingState from '../../constants/loadingState';
import { SAMPLE_ID_FIELD } from '../../constants/metadataConsts';
import MetadataLoadingState, { hasCompleteData } from '../../constants/metadataLoadingState';
import { columnStyleRules, combineClasses } from '../../styles/metadataFieldStyles';
import type { Sample } from '../../types/sample.interface';
import { useStateFromSearchParamsForFilterObject } from '../../utilities/stateUtils';
import {
  buildPrimeReactColumnDefinitions,
  type PrimeReactColumnDefinition,
} from '../../utilities/tableUtils';
import ExportTableData from '../Common/ExportTableData';
import DataFilters, { defaultState } from '../DataFilters/DataFilters';
import ColumnVisibilityMenu from '../TableComponents/ColumnVisibilityMenu';
import sortIcon from '../TableComponents/SortIcon';
import { ChangeOwnershipBlocked } from './OrgSampleOwnership/ChangeOwnershipBlocked';
import OrgSampleOwnership from './OrgSampleOwnership/OrgSampleOwnership';
import OrgSampleShare from './OrgSampleShare/OrgSampleShare';
import OrgSampleUnshare from './OrgSampleShare/OrgSampleUnshare';
import { ShareBlocked } from './OrgSampleShare/ShareBlocked';

interface SamplesProps {
  canShare: boolean;
  canChangeOwnership: boolean;
  orgAbbrev: string;
  orgName: string;
}

function OrgSamplesTable(props: SamplesProps) {
  const { canShare, canChangeOwnership, orgAbbrev, orgName } = props;
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
  const [allFieldsLoaded, setAllFieldsLoaded] = useState<boolean>(false);
  // Table row selection/display
  const [selectAll, setSelectAll] = useState(false);
  // const [allIds, setAllIds] = useState<string[]>([]);
  const [displayRows, setDisplayRows] = useState<Sample[]>([]);
  const [showSelectedRowsOnly, setShowSelectedRowsOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formattedData, setFormattedData] = useState<Sample[]>([]);
  // Sharing samples
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openShareDialog, setOpenShareDialog] = useState<boolean>(false);
  const [openUnshareDialog, setOpenUnshareDialog] = useState<boolean>(false);
  const [openShareBlocked, setOpenShareBlocked] = useState(false);
  const [openOwnershipDialog, setOpenOwnershipDialog] = useState<boolean>(false);
  const [openChangeOwnerBlocked, setOpenChangeOwnerBlocked] = useState(false);

  const metadata: OrgMetadataState | null = useAppSelector((state) =>
    selectOrgMetadata(state, orgAbbrev),
  );
  const isSamplesLoading: boolean = useAppSelector((state) =>
    selectAwaitingOrgMetadata(state, orgAbbrev),
  );

  useEffect(() => {
    if (metadata?.loadingState === MetadataLoadingState.ERROR) {
      setErrorDialogOpen(true);
    }
  }, [metadata?.loadingState]);

  useEffect(() => {
    if (!metadata?.fields) return;
    const columnBuilder = buildPrimeReactColumnDefinitions(metadata.fields);
    setSampleTableColumns(columnBuilder);

    if (hasCompleteData(metadata.loadingState)) {
      setAllFieldsLoaded(true);
      setDisplayRows(metadata.metadata ?? []);
    }
  }, [metadata?.fields, metadata?.loadingState, metadata?.metadata]);

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
      // biome-ignore lint/suspicious/noConsole: historic
      console.error(`${SAMPLE_ID_FIELD} not found in selectedRow.`);
    }
  };

  const handleDialogClose = () => {
    setExportCSVStatus(LoadingState.IDLE);
  };

  const selectedSamples = useMemo(
    () => formattedData.filter((sample: any) => selectedIds.includes(sample.Seq_ID)),
    [formattedData, selectedIds],
  );

  const shareBlocked = selectedIds.length === 0 || !canShare;
  const changeOwnerBlocked = selectedIds.length === 0 || !canChangeOwnership;

  useEffect(() => {
    if (showSelectedRowsOnly && selectedSamples.length > 0) {
      setDisplayRows(selectedSamples);
    }
  }, [selectedSamples, showSelectedRowsOnly]);

  useEffect(() => {
    if (!showSelectedRowsOnly && hasCompleteData(metadata?.loadingState)) {
      setDisplayRows(metadata?.metadata ?? []);
    }
  }, [metadata?.metadata, metadata?.loadingState, showSelectedRowsOnly]);

  const toggleShowSelectedRowsOnly = () => {
    setShowSelectedRowsOnly((prev) => !prev);
  };

  const onSelectAllChange = (e: DataTableSelectAllChangeEvent) => {
    const { checked } = e;
    if (checked) {
      setSelectAll(true);
      setSelectedIds(formattedData.map((s: any) => s.Seq_ID));
    } else {
      setSelectAll(false);
      setSelectedIds([]);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: force new filters reference on data refresh
  const dataTableFilters = useMemo(
    () => ({ ...(allFieldsLoaded ? currentFilters : defaultState) }),
    [allFieldsLoaded, currentFilters, displayRows],
  );

  // Set export data based on filtered vs display data length
  const exportData = useMemo(
    () => (displayRows.length < filteredSampleList.length ? displayRows : filteredSampleList),
    [displayRows, filteredSampleList],
  );

  const handleShareClick = () => {
    if (shareBlocked) {
      setOpenShareBlocked(true);
    } else {
      setOpenShareDialog(true);
    }
  };

  const handleUnshareClick = () => {
    if (shareBlocked) {
      setOpenShareBlocked(true);
    } else {
      setOpenUnshareDialog(true);
    }
  };

  const handleChangeOwnerClick = () => {
    if (changeOwnerBlocked) {
      setOpenChangeOwnerBlocked(true);
    } else {
      setOpenOwnershipDialog(true);
    }
  };

  const header = (
    <div
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Tooltip
          title={showSelectedRowsOnly ? 'Show Unselected' : 'Hide Unselected'}
          placement="top"
        >
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
          {true && (
            <Tooltip title="Transfer samples" placement="top" arrow>
              <IconButton onClick={handleChangeOwnerClick}>
                <SwapHorizontalCircle />
              </IconButton>
            </Tooltip>
          )}
          <>
            <Tooltip title="Share or unshare samples" placement="top" arrow>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <Box sx={{ position: 'relative', width: 24, height: 24 }}>
                  <IosShare sx={{ fontSize: 24 }} />
                  <Settings
                    sx={{
                      position: 'absolute',
                      bottom: -5,
                      right: -5,
                      fontSize: 16,
                      backgroundColor: 'white',
                      borderRadius: '50%',
                    }}
                  />
                </Box>
              </IconButton>
            </Tooltip>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
              <MenuList dense sx={{ paddingTop: 0, paddingBottom: 0 }}>
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    handleShareClick();
                  }}
                >
                  <ListItemIcon>
                    <IosShare fontSize="small" />
                  </ListItemIcon>
                  Share samples
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    handleUnshareClick();
                  }}
                >
                  <ListItemIcon>
                    <Box sx={{ position: 'relative', width: 24, height: 24 }}>
                      <IosShare sx={{ fontSize: 24 }} />
                      <RemoveCircleOutline
                        sx={{
                          position: 'absolute',
                          bottom: -5,
                          right: -5,
                          transform: 'scale(0.7)',
                          backgroundColor: 'white',
                          borderRadius: '50%',
                        }}
                      />
                    </Box>
                  </ListItemIcon>
                  Unshare samples
                </MenuItem>
              </MenuList>
            </Menu>
          </>
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
            dataToExport={exportData ?? []}
            headers={sampleTableColumns.filter((col) => !col.hidden).map((col) => col.header)}
            disabled={!hasCompleteData(metadata?.loadingState)}
            fileNamePrefix={orgAbbrev}
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
          <strong>Organisation metadata could not be loaded</strong>
        </AlertTitle>
        An error occurred loading organisation metadata.
        <br />
        Please check you have appropriate permissions to view organisation sample data, and contact
        the {import.meta.env.VITE_BRANDING_NAME} team if this error persists.
      </Alert>
    </Dialog>
  );

  return (
    <div className="datatable-container-org">
      <Backdrop
        sx={{ color: Theme.Background, zIndex: 2000 }}
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
        />
      )}
      {openUnshareDialog && (
        <OrgSampleUnshare
          open={openUnshareDialog}
          onClose={() => setOpenUnshareDialog(false)}
          selectedSamples={selectedSamples}
          selectedIds={selectedIds}
          orgAbbrev={orgAbbrev}
        />
      )}
      {openChangeOwnerBlocked && (
        <ChangeOwnershipBlocked
          canChangeOwnership={canChangeOwnership}
          openChangeOwnershipBlocked={openChangeOwnerBlocked}
          setOpenChangeOwnershipBlocked={setOpenChangeOwnerBlocked}
          selectedIdsLength={selectedIds.length}
        />
      )}
      {openOwnershipDialog && (
        <OrgSampleOwnership
          open={openOwnershipDialog}
          onClose={() => setOpenOwnershipDialog(false)}
          selectedSamples={selectedSamples}
          selectedIds={selectedIds}
          orgAbbrev={orgAbbrev}
          orgName={orgName}
        />
      )}
      {openChangeOwnerBlocked && (
        <ChangeOwnershipBlocked
          canChangeOwnership={canChangeOwnership}
          openChangeOwnershipBlocked={openChangeOwnerBlocked}
          setOpenChangeOwnershipBlocked={setOpenChangeOwnerBlocked}
          selectedIdsLength={selectedIds.length}
        />
      )}
      {openOwnershipDialog && (
        <OrgSampleOwnership
          open={openOwnershipDialog}
          onClose={() => setOpenOwnershipDialog(false)}
          selectedSamples={selectedSamples}
          selectedIds={selectedIds}
          orgAbbrev={orgAbbrev}
          orgName={orgName}
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
          Please try again later, or contact the {import.meta.env.VITE_BRANDING_NAME} team.
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
          filters={dataTableFilters}
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
