/* eslint-disable react/jsx-pascal-case */
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, {
  memo, useEffect, useRef, Dispatch, SetStateAction, useState,
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
import { Sample, DisplayField, Group, MetaDataColumn } from '../../types/dtos';
import QueryBuilder, { Filter } from '../Common/QueryBuilder';
import LoadingState from '../../constants/loadingState';
import isoDateLocalDate, { isoDateLocalDateNoTime } from '../../utilities/helperUtils';
import { ResponseObject, getDisplayFields, getSamples, getTotalSamples } from '../../utilities/resourceUtils';

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
  const tableInstanceRef = useRef(null);
  const csvLink = useRef<CSVLink & HTMLAnchorElement & { link: HTMLAnchorElement }>(null);
  const [sampleTableColumns, setSampleTableColumns] = useState<MRT_ColumnDef[]>([]);
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [samplesPagination, setSamplesPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [columnOrderArrayInitial, setColumnOrderArrayInitial] = useState<string[]>([]);
  const [columnOrderArray, setColumnOrderArray] = useState<string[]>([]);
  const [isSamplesLoading, setIsSamplesLoading] = useState(false);
  const [sampleList, setSampleList] = useState<Sample[]>([]);
  const [totalSamples, setTotalSamples] = useState(0);
  const [samplesCount, setSamplesCount] = useState(0);
  const [isSamplesError, setIsSamplesError] = useState({
    samplesHeaderError: false,
    samplesTotalError: false,
    sampleMetadataError: false,
    samplesErrorMessage: '',
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [queryString, setQueryString] = useState('');
  const [filterList, setFilterList] = useState<Filter[]>([]);
  const [exportCSVStatus, setExportCSVStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [exportData, setExportData] = useState<Sample[]>([]);
  const [displayFields, setDisplayFields] = useState<DisplayField[]>([]);

  useEffect(() => {
    async function getFields() {
      const filterFieldsResponse: ResponseObject = await getDisplayFields(groupContext!);
      if (filterFieldsResponse.status === 'Success') {
        setDisplayFields(filterFieldsResponse.data);
      } else {
        setIsSamplesError((prevState) => ({
          ...prevState,
          samplesHeaderError: true,
          samplesErrorMessage: filterFieldsResponse.message,
        }));
        setIsSamplesLoading(false);
      }
    }
    async function getTotalSamplesOverall() {
      const totalSamplesResponse: ResponseObject = await getTotalSamples(groupContext!);
      if (totalSamplesResponse.status === 'Success') {
        const count: string = totalSamplesResponse.headers?.get('X-Total-Count')!;
        setTotalSamples(+count);
      } else {
        setIsSamplesError((prevState) => ({
          ...prevState,
          samplesTotalError: true,
          samplesErrorMessage: totalSamplesResponse.message,
        }));
        setIsSamplesLoading(false);
      }
    }
    if (groupContext !== undefined) {
      setIsSamplesLoading(true);
      getFields();
      getTotalSamplesOverall();
    }
  }, [groupContext]);

  useEffect(
    () => {
      // Maps from a hard-coded metadata field name to a function to render the cell value
      // Duplicated here for now until Samples.tsx and SampleTable.tsx are merged
      const sampleRenderFunctions : { [index: string]: Function } = {
        'Shared_groups': (value: any) => value.toString().replace(/[[\]"']/g, ''),
      };
      // Fields which should be rendered as datetimes, not just dates
      // This hard-coding is interim until the server is able to provide this information
      const datetimeFields = new Set(['Date_created', 'Date_updated']);

      // BUILD COLUMNS
      const formatTableHeaders = () => {
        function compareFields(field1: DisplayField, field2: DisplayField) {
          if (field1.columnOrder < field2.columnOrder) {
            return -1;
          }
          if (field1.columnOrder > field2.columnOrder) {
            return 1;
          }
          return 0;
        }
        const columnBuilder: React.SetStateAction<MRT_ColumnDef<{}>[]> = [];
        const copy = [...displayFields]; // Creating copy of original array so it's not overridden
        const sortedDisplayFields = copy.sort(compareFields);
        sortedDisplayFields.forEach((element: MetaDataColumn) => {
          if (element.columnName in sampleRenderFunctions) {
            columnBuilder.push({
              accessorKey: element.columnName,
              header: `${element.columnName}`,
              Cell: ({ cell }) => sampleRenderFunctions[element.columnName](cell.getValue()),
            });
          } else if (element.primitiveType === 'boolean') {
            columnBuilder.push({
              accessorKey: element.columnName,
              header: `${element.columnName}`,
              Cell: ({ cell }) => (cell.getValue() ? 'true' : 'false'),
            });
          } else if (element.primitiveType === 'date') {
            columnBuilder.push({
              accessorKey: element.columnName,
              header: `${element.columnName}`,
              Cell: ({ cell }: any) => (
                datetimeFields.has(element.columnName)
                  ? isoDateLocalDate(cell.getValue())
                  : isoDateLocalDateNoTime(cell.getValue())),
            });
          } else {
            columnBuilder.push({
              accessorKey: element.columnName,
              header: `${element.columnName}`,
            });
          }
        });
        setSampleTableColumns(columnBuilder);
        setIsSamplesError((prevState: any) => ({ ...prevState, samplesHeaderError: false }));
      };
      if (!isSamplesError.samplesHeaderError && !isSamplesError.samplesTotalError) {
        formatTableHeaders();
      }
    },
    [
      displayFields,
      isSamplesError.samplesHeaderError,
      isSamplesError.samplesTotalError,
      setIsSamplesError,
      setSampleTableColumns,
    ],
  );

  // GET SAMPLES - paginated
  useEffect(
    () => {
    // Only get samples when columns are already populated
    // effects should trigger getProject -> getHeaders -> this function
      async function getSamplesList() {
        let sortString = '';
        if (sorting.length !== 0) {
          if (sorting[0].desc === false) {
            sortString = sorting[0].id;
          } else {
            sortString = `-${sorting[0].id}`;
          }
        }
        const searchParams = new URLSearchParams({
          Page: (samplesPagination.pageIndex + 1).toString(),
          PageSize: (samplesPagination.pageSize).toString(),
          groupContext: `${groupContext}`,
          filters: queryString,
          sorts: sortString,
        });
        const samplesResponse: ResponseObject = await getSamples(searchParams.toString());
        if (samplesResponse.status === 'Success') {
          setSampleList(samplesResponse.data);
          setIsSamplesError((prevState) => ({ ...prevState, sampleMetadataError: false }));
          setIsSamplesLoading(false);
          const count: string = samplesResponse.headers?.get('X-Total-Count')!;
          setSamplesCount(+count);
        } else {
          setIsSamplesLoading(false);
          setIsSamplesError((prevState) => ({
            ...prevState,
            sampleMetadataError: true,
            samplesErrorMessage: samplesResponse.message,
          }));
          setSampleList([]);
        }
      }
      if (sampleTableColumns.length > 0) {
        getSamplesList();
      } else {
        setSampleList([]);
        setIsSamplesLoading(false);
      }
    },
    [groupContext, samplesPagination.pageIndex, samplesPagination.pageSize,
      sampleTableColumns, queryString, sorting],
  );

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

  // GET SAMPLES - not paginated
  const getExportData = async () => {
    setExportCSVStatus(LoadingState.LOADING);
    const searchParams = new URLSearchParams({
      Page: '1',
      PageSize: (totalSamples).toString(),
      groupContext: `${groupContext!}`,
      filters: queryString,
    });
    const samplesResponse: ResponseObject = await getSamples(searchParams.toString());
    if (samplesResponse.status === 'Success') {
      setExportData(samplesResponse.data);
    } else {
      setExportCSVStatus(LoadingState.ERROR);
    }
  };

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
  const totalSamplesDisplay = `Total unfiltered records: ${totalSamples.toLocaleString('en-us')}`;
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
        tableInstanceRef={tableInstanceRef}
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
          density: 'compact',
        }}
        manualSorting
        onSortingChange={setSorting}
        rowCount={samplesCount}
        muiTableProps={{ sx: { width: 'auto', tableLayout: 'auto' } }}
        enableColumnResizing
        // enableColumnDragging
        // enableColumnOrdering
        enableDensityToggle={false}
        enableFullScreenToggle={false}
        enableRowVirtualization
        // enableColumnVirtualization
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
export default memo(SampleTable);
