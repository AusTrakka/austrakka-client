import React, { memo, useState } from 'react';
import MaterialReactTable, { MRT_PaginationState, MRT_ColumnDef } from 'material-react-table';
import {
  Box, IconButton, Tooltip,
  CircularProgress, Dialog,
  Backdrop, Alert, AlertTitle,
} from '@mui/material';
import { FileDownload, Close } from '@mui/icons-material';
// eslint-disable-next-line import/no-extraneous-dependencies
import { ExportToCsv } from 'export-to-csv';
import styles from './ProjectOverview.module.css';
import { ProjectSample } from '../../types/sample.interface';
import { getSamples, ResponseObject } from '../../utilities/resourceUtils';

interface SamplesProps {
  sampleList: ProjectSample[],
  totalSamples: number,
  isSamplesLoading: boolean,
  sampleTableColumns: MRT_ColumnDef<{}>[],
  isSamplesError: {
    samplesHeaderError: boolean,
    sampleMetadataError: boolean,
    samplesErrorMessage: string,
  },
  samplesPagination: MRT_PaginationState,
  setSamplesPagination: any, // TODO: fix
}

function Samples(props: SamplesProps) {
  const {
    sampleList,
    totalSamples,
    isSamplesLoading,
    sampleTableColumns,
    isSamplesError,
    samplesPagination,
    setSamplesPagination,
  } = props;
  const [exportCSVLoading, setExportCSVLoading] = useState(false);
  const [exportCSVError, setExportCSVError] = useState(false);
  // const [exportData, setExportData] = useState();
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
  const csvOptions = {
    fieldSeparator: ',',
    quoteStrings: '"',
    decimalSeparator: '.',
    showLabels: true,
    useBom: true,
    useKeysAsHeaders: false,
    headers: sampleTableColumns.map((c) => c.header),
    filename: generateFilename(),
  };
  const csvExporter = new ExportToCsv(csvOptions);
  // TODO: Move this up to the parent component - will cause error if totalSamples > backend limit
  async function getSamplesList() {
    const searchParams = new URLSearchParams({
      Page: '1',
      PageSize: (totalSamples).toString(),
      groupContext: `${sessionStorage.getItem('selectedProjectMemberGroupId')}`,
    });
    const samplesResponse: ResponseObject = await getSamples(searchParams.toString());
    if (samplesResponse.status === 'Success') {
      // setExportData(samplesResponse.data);
      csvExporter.generateCsv(samplesResponse.data);
      setExportCSVLoading(false);
      setExportCSVError(false);
    } else {
      // TODO: Add error dialog
      setExportCSVLoading(false);
      setExportCSVError(true);
    }
  }
  const exportCSV = () => {
    setExportCSVLoading(true);
    getSamplesList();
  };
  const ExportButton = (
    <div>
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
      <Tooltip title="Export to CSV" placement="top">
        <IconButton
          onClick={() => {
            exportCSV();
          }}
          disabled={exportCSVLoading}
        >
          <FileDownload />
        </IconButton>
      </Tooltip>
    </div>
  );
  const handleDialogClose = () => {
    setExportCSVError(false);
  };
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
      <MaterialReactTable
        columns={sampleTableColumns}
        data={sampleList}
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
        rowCount={totalSamples}
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
        renderToolbarInternalActions={() => (
          <Box>
            {ExportButton}
          </Box>
        )}
      />
    </>
  );
}
export default memo(Samples);
