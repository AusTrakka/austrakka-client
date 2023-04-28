/* eslint-disable react/jsx-pascal-case */
import React, {
  memo, useCallback, useEffect, useRef,
} from 'react';
import MaterialReactTable, {
  MRT_PaginationState, MRT_ColumnDef, MRT_ShowHideColumnsButton, MRT_TablePagination,
} from 'material-react-table';
import { FilterList, FileDownload, Close } from '@mui/icons-material';
import {
  Box, IconButton, Tooltip, Typography,
  CircularProgress, Dialog,
  Backdrop, Alert, AlertTitle,
} from '@mui/material';
import { CSVLink } from 'react-csv';
import styles from './ProjectOverview.module.css';
import { ProjectSample } from '../../types/sample.interface';
import { DisplayFields } from '../../types/fields.interface';
import QueryBuilder, { Filter } from '../Common/QueryBuilder';

interface SamplesProps {
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
  setSamplesPagination: React.Dispatch<React.SetStateAction<MRT_PaginationState>>,
  isFiltersOpen: boolean,
  setIsFiltersOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setQueryString: React.Dispatch<React.SetStateAction<string>>,
  setFilterList: React.Dispatch<React.SetStateAction<Filter[]>>,
  filterList: Filter[],
  displayFields: DisplayFields[],
  getExportData: Function,
  exportData: ProjectSample[],
  setExportData: React.Dispatch<React.SetStateAction<ProjectSample[]>>,
  exportCSVLoading: boolean,
  setExportCSVLoading: React.Dispatch<React.SetStateAction<boolean>>,
  exportCSVError: boolean,
  setExportCSVError:React.Dispatch<React.SetStateAction<boolean>>,
}

function Samples(props: SamplesProps) {
  const {
    sampleList,
    totalSamples,
    samplesCount,
    isSamplesLoading,
    sampleTableColumns,
    isSamplesError,
    samplesPagination,
    setSamplesPagination,
    isFiltersOpen,
    setIsFiltersOpen,
    setQueryString,
    filterList,
    setFilterList,
    displayFields,
    getExportData,
    exportData,
    setExportData,
    exportCSVLoading,
    setExportCSVLoading,
    exportCSVError,
    setExportCSVError,
  } = props;
  const csvLink = useRef<CSVLink & HTMLAnchorElement & { link: HTMLAnchorElement }>(null);

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
  const updateExportedStates = useCallback((isExported: boolean) => {
    setExportCSVLoading(false);
    setExportCSVError(!isExported);
    setExportData([]);
  }, [setExportCSVError, setExportCSVLoading, setExportData]);

  useEffect(
    () => {
      if (exportData.length > 0 && exportCSVLoading && !exportCSVError) {
        try {
          csvLink?.current?.link.click();
          updateExportedStates(true);
        } catch (error) {
          updateExportedStates(false);
        }
      }
    },
    [exportCSVError, exportCSVLoading, exportData, sampleTableColumns, updateExportedStates],
  );

  const ExportButton = (
    <>
      <CSVLink
        data={exportData}
        ref={csvLink}
        style={{ display: 'none' }}
        filename={generateFilename() || 'austrakka_export.csv'}
      />
      <Tooltip title="Export to CSV" placement="top">
        <IconButton
          onClick={() => {
            getExportData();
          }}
          disabled={exportCSVLoading || sampleList.length < 1}
        >
          {exportCSVLoading
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
      </Tooltip>
    </>
  );
  const handleDialogClose = () => {
    setExportCSVError(false);
  };
  const totalSamplesDisplay = `Total unfiltered records: ${totalSamples.toLocaleString('en-us')}`;
  return (
    <>
      <p className={styles.h1}>Samples</p>
      <Backdrop
        sx={{ color: '#fff', zIndex: 1101 }} // TODO: Find a better way to set index higher then top menu
        open={exportCSVLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <br />
      <Dialog onClose={handleDialogClose} open={exportCSVError}>
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
          isLoading: isSamplesLoading,
          showAlertBanner: isSamplesError.sampleMetadataError || isSamplesError.samplesHeaderError,
        }}
        initialState={{ density: 'compact' }}
        rowCount={samplesCount}
        // Layout props
        muiTableProps={{ sx: { width: 'auto', tableLayout: 'auto' } }}
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
            <IconButton
              onClick={() => {
                setIsFiltersOpen(!isFiltersOpen);
              }}
            >
              <FilterList />
            </IconButton>
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
