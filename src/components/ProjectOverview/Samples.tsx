/* eslint-disable react/jsx-pascal-case */
import React, {
  memo, useEffect, Dispatch, SetStateAction, useState,
} from 'react';
import MaterialReactTable, {
  MRT_ColumnDef,
  MRT_ShowHideColumnsButton,
  MRT_TablePagination,
} from 'material-react-table';
import { FilterList, FileDownload, Close } from '@mui/icons-material';
import {
  Box, IconButton, Tooltip, Typography,
  CircularProgress, Dialog,
  Backdrop, Alert, AlertTitle, Badge,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { MetaDataColumn } from '../../types/dtos';
import QueryBuilder, { Filter } from '../Common/QueryBuilder';
import LoadingState from '../../constants/loadingState';
import { SAMPLE_ID_FIELD } from '../../constants/metadataConsts';
import DataFilters from '../DataFilters/DataFilters';
import { GroupMetadataState } from '../../app/metadataSlice';
import isoDateLocalDate, { isoDateLocalDateNoTime } from '../../utilities/helperUtils';
import MetadataLoadingState from '../../constants/metadataLoadingState';
import ExportTableData from '../Common/ExportTableData';

interface SamplesProps {
  groupMetadata: GroupMetadataState | null,
  projectAbbrev: string,
  totalSamples: number,
  isSamplesLoading: boolean,
  setFilterList: Dispatch<SetStateAction<Filter[]>>,
  filterList: Filter[],
}

function Samples(props: SamplesProps) {
  const {
    groupMetadata,
    projectAbbrev,
    totalSamples,
    isSamplesLoading,
    filterList,
    setFilterList,
  } = props;
  const navigate = useNavigate();

  const [sampleTableColumns, setSampleTableColumns] = useState<MRT_ColumnDef[]>([]);
  const [exportCSVStatus, setExportCSVStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [filteredData, setFilteredData] = useState([]);

  // Set column headers from groupMetadata state
  useEffect(() => {
    if (!groupMetadata?.fields) return;

    // Maps from a hard-coded metadata field name to a function to render the cell value
    const sampleRenderFunctions : { [index: string]: Function } = {
      'Shared_groups': (value: any) => value.toString().replace(/[[\]"']/g, ''),
    };
    // Fields which should be rendered as datetimes, not just dates
    // This hard-coding is interim until the server is able to provide this information
    const datetimeFields = new Set(['Date_created', 'Date_updated']);

    // Sort here rather than setting columnOrder
    const compareFields = (field1: { columnOrder: number; }, field2: { columnOrder: number; }) =>
      (field1.columnOrder - field2.columnOrder);
    const sortedFields = [...groupMetadata!.fields!];
    sortedFields.sort(compareFields);
    const columnBuilder: React.SetStateAction<MRT_ColumnDef<{}>[]> = [];
    sortedFields.forEach((element: MetaDataColumn) => {
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
  }, [groupMetadata]);

  // Open error dialog if loading state changes to error
  useEffect(() => {
    if (groupMetadata?.loadingState === MetadataLoadingState.ERROR ||
        groupMetadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR) {
      setErrorDialogOpen(true);
    }
  }, [groupMetadata?.loadingState]);

  const rowClickHandler = (row: any) => {
    const selectedRow = row.original;
    if (SAMPLE_ID_FIELD in selectedRow) {
      navigate(`/projects/${projectAbbrev}/records/${selectedRow[SAMPLE_ID_FIELD]}`);
    }
  };

  // Update CSV export status as data loads
  // CSV export is not permitted until data is FULLY loaded
  // If a load error occurs, we will pass no data to the ExportTableData component
  // However we don't set an error here as we want to see a load error, not CSV download error
  useEffect(() => {
    setExportCSVStatus(
      isSamplesLoading || groupMetadata?.loadingState === MetadataLoadingState.PARTIAL_DATA_LOADED ?
        LoadingState.LOADING :
        LoadingState.SUCCESS,
    );
  }, [isSamplesLoading, groupMetadata?.loadingState]);

  const totalSamplesDisplay = `Total unfiltered records: ${totalSamples.toLocaleString('en-us')}`;

  if (isSamplesLoading) return null;

  return (
    <>
      <Backdrop
        // This Backdrop will not do anything in a tab, where the entire display is suppressed
        sx={{ color: '#fff', zIndex: 2000 }} // TODO: Find a better way to set index higher then top menu
        open={isSamplesLoading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
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
              {groupMetadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR ?
                'Project metadata could not be fully loaded' :
                'Project metadata could not be loaded'}
            </strong>
          </AlertTitle>
          {groupMetadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR ?
            `An error occured loading project metadata. Some fields will be null, and 
          CSV export will not be available. Refresh to reload.` :
            'An error occured loading project metadata. Refresh to reload.'}
          <br />
          Please contact an AusTrakka admin if this error persists.
        </Alert>
      </Dialog>
      <DataFilters
        data={groupMetadata?.metadata ?? []}
        fields={groupMetadata?.fields ?? []} // want to pass in field loading states?
        setFilteredData={setFilteredData}
        initialOpen
      />
      <MaterialReactTable
        columns={sampleTableColumns}
        data={filteredData}
        enableColumnFilters={false}
        enableStickyHeader
        columnResizeMode="onChange"
        muiLinearProgressProps={({ isTopToolbar }) => ({
          color: 'secondary',
          sx: { display: isTopToolbar ? 'block' : 'none' },
        })}
        muiTableContainerProps={{ sx: { maxHeight: '75vh' } }}
        muiTablePaginationProps={{
          rowsPerPageOptions: [10, 25, 50, 100, 500, 1000],
        }}
        initialState={{
          density: 'compact',
        }}
        state={{
          isLoading: isSamplesLoading,
          showAlertBanner: groupMetadata?.loadingState === MetadataLoadingState.ERROR ||
                           groupMetadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR,
        }}
        muiToolbarAlertBannerProps={
          {
            color: 'error',
            children: groupMetadata?.errorMessage,
          }
        }
        rowCount={filteredData.length}
        // Layout props
        muiTableProps={{ sx: { width: 'auto', tableLayout: 'auto' } }}
        muiTableBodyRowProps={({ row }) => ({
          onClick: () => rowClickHandler(row),
          sx: { cursor: 'pointer' },
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
        // enableColumnVirtualization  // bug where some columns do not render on load
        renderToolbarInternalActions={({ table }) => (
          <Box>
            <ExportTableData
              dataToExport={
                groupMetadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR ?
                  [] : filteredData
              }
              exportCSVStatus={exportCSVStatus}
              setExportCSVStatus={setExportCSVStatus}
            />
            {/* TODO This depends on knowing datafilter's filters
            <Tooltip title="Show/Hide filters" placement="top" arrow>
              <span>
                <IconButton
                  onClick={() => {
                    // TODO will need to alter DataFilters to enable this
                    //setIsFiltersOpen(!isFiltersOpen);
                  }}
                  // TODO do we really need to disable this if there are no samples?
                  //disabled={sampleList.length < 1 && filterList.length < 1}
                >
                  <Badge
                    badgeContent={filterList.length}
                    color="primary"
                    showZero
                    //invisible={sampleList.length < 1 && filterList.length < 1}
                  >
                    <FilterList />
                  </Badge>
                </IconButton>
              </span>
            </Tooltip>
                */}
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
