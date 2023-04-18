import React, { memo, useState } from 'react';
import MaterialReactTable, { MRT_PaginationState, MRT_ColumnDef } from 'material-react-table';
import {
  Box, IconButton, Tooltip, CircularProgress,
} from '@mui/material';
import { FileDownload } from '@mui/icons-material';
import styles from './ProjectOverview.module.css';
import { ProjectSample } from '../../types/sample.interface';

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
  const exportCSV = () => {
    setExportCSVLoading(true);
    // TODO: Export CSV functionaility here and remove setTimeout
    setTimeout(() => setExportCSVLoading(false), 3000);
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
      <Tooltip title="Export CSV">
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
  return (
    <>
      <p className={styles.h1}>Samples</p>
      <br />
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
