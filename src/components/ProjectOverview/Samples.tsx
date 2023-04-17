/* eslint-disable react/jsx-pascal-case */
import React, { memo } from 'react';
import MaterialReactTable, {
  MRT_PaginationState, MRT_ColumnDef, MRT_ShowHideColumnsButton, MRT_TablePagination,
} from 'material-react-table';
import { Box, IconButton, Typography } from '@mui/material';
import { FilterList } from '@mui/icons-material';
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
  setSamplesPagination: any, // TODO: fix
  isFiltersOpen: boolean,
  setIsFiltersOpen: any,
  setQueryString: any,
  setFilterList: any,
  filterList: Filter[],
  displayFields: DisplayFields[],
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
  } = props;
  const totalSamplesDisplay = `Total unfiltered records: ${totalSamples.toLocaleString('en-us')}`;
  return (
    <>
      <p className={styles.h1}>Samples</p>
      <br />
      {/* TODO: Pass totalSamples and sampelCount to query builder to show filtering message */}
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
