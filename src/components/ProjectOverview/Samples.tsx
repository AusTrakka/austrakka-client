import React, { memo } from 'react';
import MaterialReactTable, { MRT_PaginationState, MRT_ColumnDef } from 'material-react-table';
import styles from './ProjectOverview.module.css';
import { ProjectSample } from '../../types/sample.interface';

// TODO: move sample list state to parent component (headers and data)

interface SamplesProps {
  sampleList: ProjectSample[],
  totalSamples: number,
  isSamplesLoading: boolean,
  sampleTableColumns: MRT_ColumnDef<{}>[],
  isSamplesError: boolean,
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
              children: 'Error loading data',
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
          rowsPerPageOptions: [10, 25, 50, 100, 500, 1000, 2000, 3000],
        }}
        onPaginationChange={setSamplesPagination}
        state={{
          pagination: samplesPagination,
          isLoading: isSamplesLoading,
          showAlertBanner: isSamplesError,
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
      />
    </>
  );
}
export default memo(Samples);
