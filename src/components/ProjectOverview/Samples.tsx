/* eslint-disable react/jsx-pascal-case */
import React, {
  memo, useEffect, useRef, Dispatch, SetStateAction,
} from 'react';
import MaterialReactTable, {
  MRT_PaginationState,
  MRT_ColumnDef,
  MRT_ShowHideColumnsButton,
  MRT_TablePagination,
  MRT_SortingState,
} from 'material-react-table';
import { FilterList, FileDownload, Close } from '@mui/icons-material';
import {
  Box, IconButton, Tooltip, Typography,
  CircularProgress, Dialog,
  Backdrop, Alert, AlertTitle, Badge,
} from '@mui/material';
import { CSVLink } from 'react-csv';
import { useNavigate } from 'react-router-dom';
import { ProjectSample } from '../../types/sample.interface';
import { DisplayField } from '../../types/dtos';
import QueryBuilder, { Filter } from '../Common/QueryBuilder';
import LoadingState from '../../constants/loadingState';
import { SAMPLE_ID_FIELD } from '../../constants/metadataConsts';

interface SamplesProps {
  projectAbbrev: string,
  sampleList: ProjectSample[],
  totalSamples: number,
  samplesCount: number,
  isSamplesLoading: boolean,
  sampleTableColumns: MRT_ColumnDef<{}>[],
  isSamplesError: {
    samplesHeaderError: boolean,
    sampleMetadataError: boolean,
    samplesErrorMessage: string,
  },
  samplesPagination: MRT_PaginationState,
  columnOrderArray: string[],
  setSamplesPagination: Dispatch<SetStateAction<MRT_PaginationState>>,
  setSorting: Dispatch<SetStateAction<MRT_SortingState>>,
  sorting: MRT_SortingState,
  isFiltersOpen: boolean,
  setIsFiltersOpen: Dispatch<SetStateAction<boolean>>,
  setQueryString: Dispatch<SetStateAction<string>>,
  setFilterList: Dispatch<SetStateAction<Filter[]>>,
  filterList: Filter[],
  displayFields: DisplayField[],
  getExportData: Function,
  exportData: ProjectSample[],
  setExportData: Dispatch<SetStateAction<ProjectSample[]>>,
  exportCSVStatus: LoadingState,
  setExportCSVStatus: Dispatch<SetStateAction<LoadingState>>,
}

function Samples(props: SamplesProps) {
  const {
    projectAbbrev,
    sampleList,
    totalSamples,
    samplesCount,
    isSamplesLoading,
    sampleTableColumns,
    isSamplesError,
    samplesPagination,
    setSamplesPagination,
    setSorting,
    sorting,
    isFiltersOpen,
    setIsFiltersOpen,
    setQueryString,
    filterList,
    setFilterList,
    displayFields,
    columnOrderArray,
    getExportData,
    exportData,
    setExportData,
    exportCSVStatus,
    setExportCSVStatus,
  } = props;
  const csvLink = useRef<CSVLink & HTMLAnchorElement & { link: HTMLAnchorElement }>(null);
  const navigate = useNavigate();

  const generateFilename = () => {
    const dateObject = new Date();
    const year = dateObject.toLocaleString('default', { year: 'numeric' });
    const month = dateObject.toLocaleString('default', { month: '2-digit' });
    const day = dateObject.toLocaleString('default', { day: '2-digit' });
    const h = dateObject.getHours();
    const m = dateObject.getMinutes();
    const s = dateObject.getSeconds();
    return `austrakka_export_${year}${month}${day}_${h}${m}${s}`;
  };

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

  const ExportButton = (
    <>
      <CSVLink
        data={exportData}
        ref={csvLink}
        style={{ display: 'none' }}
        filename={generateFilename() || 'austrakka_export.csv'}
      />
      <Tooltip title="Export to CSV" placement="top" arrow>
        <span>
          <IconButton
            onClick={() => {
              getExportData();
            }}
            disabled={exportCSVStatus === LoadingState.LOADING || sampleList.length < 1}
          >
            {exportCSVStatus === LoadingState.LOADING
              ? (
                <CircularProgress
                  color="secondary"
                  size={40}
                  sx={{
                    position: 'absolute',
                    zIndex: 1,
                  }}
                />
              )
              : null}
            <FileDownload />
          </IconButton>
        </span>
      </Tooltip>
    </>
  );

  const handleDialogClose = () => {
    setExportCSVStatus(LoadingState.IDLE);
  };

  const rowClickHandler = (row: any) => {
    const selectedRow = row.original;
    if (SAMPLE_ID_FIELD in selectedRow) {
      navigate(`/projects/${projectAbbrev}/records/${selectedRow[SAMPLE_ID_FIELD]}`);
    }
  };

  const totalSamplesDisplay = `Total unfiltered records: ${totalSamples.toLocaleString('en-us')}`;

  if (isSamplesLoading) return null;

  return (
    <>
      <Backdrop
        sx={{ color: '#fff', zIndex: 2000 }} // TODO: Find a better way to set index higher then top menu
        open={exportCSVStatus === LoadingState.LOADING}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
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
      <QueryBuilder
        isOpen={isFiltersOpen}
        setIsOpen={setIsFiltersOpen}
        setQueryString={setQueryString}
        fieldList={displayFields}
        filterList={filterList}
        setFilterList={setFilterList}
        totalSamples={totalSamples}
        samplesCount={samplesCount}
      />
      <MaterialReactTable
        columns={sampleTableColumns}
        data={sampleList}
        enableColumnFilters={false}
        enableStickyHeader
        manualPagination
        manualFiltering
        columnResizeMode="onChange"
        muiToolbarAlertBannerProps={
          isSamplesError
            ? {
              color: 'error',
              children: isSamplesError.samplesErrorMessage,
            }
            : undefined
        }
        // muiTableBodyProps={{
        //   sx: {
        //     //stripe the rows, make odd rows a darker color
        //     '& tr:nth-of-type(odd)': {
        //       backgroundColor: '#f5f5f5',
        //     },
        //   },
        // }}
        muiLinearProgressProps={({ isTopToolbar }) => ({
          color: 'secondary',
          sx: { display: isTopToolbar ? 'block' : 'none' },
        })}
        muiTableContainerProps={{ sx: { maxHeight: '75vh' } }}
        muiTablePaginationProps={{
          rowsPerPageOptions: [10, 25, 50, 100, 500, 1000],
        }}
        onPaginationChange={setSamplesPagination}
        state={{
          pagination: samplesPagination,
          sorting,
          isLoading: isSamplesLoading,
          showAlertBanner: isSamplesError.sampleMetadataError || isSamplesError.samplesHeaderError,
          columnOrder: columnOrderArray,
        }}
        manualSorting
        onSortingChange={setSorting}
        initialState={{ density: 'compact' }}
        rowCount={samplesCount}
        // Layout props
        muiTableProps={{ sx: { width: 'auto', tableLayout: 'auto' } }}
        muiTableBodyRowProps={({ row }) => ({
          onClick: () => rowClickHandler(row),
          sx: {
            cursor: 'pointer',
          },
        })}
        // Column manipulation
        enableColumnResizing
        enableColumnDragging
        enableColumnOrdering
        // Improving performance
        enableDensityToggle={false}
        enableFullScreenToggle={false}
        // memoMode="cells"
        enableRowVirtualization
        enableColumnVirtualization
        renderToolbarInternalActions={({ table }) => (
          <Box>
            {ExportButton}
            <Tooltip title="Show/Hide filters" placement="top" arrow>
              <span>
                <IconButton
                  onClick={() => {
                    setIsFiltersOpen(!isFiltersOpen);
                  }}
                  disabled={sampleList.length < 1 && filterList.length < 1}
                >
                  <Badge
                    badgeContent={filterList.length}
                    color="primary"
                    showZero
                    invisible={sampleList.length < 1 && filterList.length < 1}
                  >
                    <FilterList />
                  </Badge>
                </IconButton>
              </span>
            </Tooltip>
            <MRT_ShowHideColumnsButton table={table} />
          </Box>
        )}
        renderBottomToolbar={({ table }) => (
          <Box sx={{ justifyContent: 'flex-end' }}>
            <MRT_TablePagination table={table} />
            <Typography variant="caption" display="block" align="right" padding={1}>
              {totalSamplesDisplay}
            </Typography>
          </Box>
        )}
      />
    </>
  );
}
export default memo(Samples);
