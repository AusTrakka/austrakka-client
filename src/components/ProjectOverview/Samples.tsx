/* eslint-disable react/jsx-pascal-case */
import React, {
  memo, useEffect, SetStateAction, useState,
} from 'react';
import MaterialReactTable, {
  MRT_ColumnDef,
  MRT_ShowHideColumnsButton,
  MRT_TablePagination,
  MRT_ToggleGlobalFilterButton,
} from 'material-react-table';
import { FilterList, Close } from '@mui/icons-material';
import {
  Box, IconButton, Tooltip, Typography,
  CircularProgress, Dialog,
  Backdrop, Alert, AlertTitle, Badge,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { MetaDataColumn } from '../../types/dtos';
import LoadingState from '../../constants/loadingState';
import { SAMPLE_ID_FIELD } from '../../constants/metadataConsts';
import DataFilters, { DataFilter } from '../DataFilters/DataFilters';
import { ProjectMetadataState } from '../../app/projectMetadataSlice';
import { fieldRenderFunctions, typeRenderFunctions } from '../../utilities/helperUtils';
import MetadataLoadingState from '../../constants/metadataLoadingState';
import ExportTableData from '../Common/ExportTableData';

interface SamplesProps {
  groupMetadata: ProjectMetadataState | null,
  projectAbbrev: string,
  totalSamples: number,
  isSamplesLoading: boolean,
  inputFilters: SetStateAction<DataFilter[]>,
}

function Samples(props: SamplesProps) {
  const {
    groupMetadata,
    projectAbbrev,
    totalSamples,
    isSamplesLoading,
    inputFilters,
  } = props;
  const navigate = useNavigate();

  const [sampleTableColumns, setSampleTableColumns] = useState<MRT_ColumnDef[]>([]);
  const [exportCSVStatus, setExportCSVStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [isDataFiltersOpen, setIsDataFiltersOpen] = useState(true);
  const [filterList, setFilterList] = useState<DataFilter[]>([]);

  // If inputFilters is changed by the parent, set the filters
  // May later replace this input with navigation parameters and dynamic URL
  useEffect(() => {
    if (inputFilters) {
      setFilterList(inputFilters);
    }
  }, [inputFilters]);

  // Set column headers from groupMetadata state
  useEffect(() => {
    if (!groupMetadata?.fields) return;

    // Sort here rather than setting columnOrder
    const compareFields = (field1: { columnOrder: number; }, field2: { columnOrder: number; }) =>
      (field1.columnOrder - field2.columnOrder);
    const sortedFields = [...groupMetadata!.fields!];
    sortedFields.sort(compareFields);
    const columnBuilder: React.SetStateAction<MRT_ColumnDef<{}>[]> = [];
    sortedFields.forEach((element: MetaDataColumn) => {
      if (element.columnName in fieldRenderFunctions) {
        columnBuilder.push({
          accessorKey: element.columnName,
          header: `${element.columnName}`,
          Cell: ({ cell }) => fieldRenderFunctions[element.columnName](cell.getValue()),
        });
      } else if (element.primitiveType && element.primitiveType in typeRenderFunctions) {
        columnBuilder.push({
          accessorKey: element.columnName,
          header: `${element.columnName}`,
          Cell: ({ cell }) => typeRenderFunctions[element.primitiveType!](cell.getValue()),
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
      isSamplesLoading ||
      groupMetadata?.loadingState === MetadataLoadingState.IDLE ||
      groupMetadata?.loadingState === MetadataLoadingState.AWAITING_DATA ||
      groupMetadata?.loadingState === MetadataLoadingState.PARTIAL_DATA_LOADED ?
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
        isOpen={isDataFiltersOpen}
        setIsOpen={setIsDataFiltersOpen}
        filterList={filterList}
        setFilterList={setFilterList}
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
            <MRT_ToggleGlobalFilterButton table={table} />
            <Tooltip title="Show/Hide filters" placement="top" arrow>
              <span>
                <IconButton
                  onClick={() => setIsDataFiltersOpen((current) => !current)}
                >
                  <Badge
                    badgeContent={filterList.length}
                    color="primary"
                    showZero
                  >
                    <FilterList />
                  </Badge>
                </IconButton>
              </span>
            </Tooltip>
            <MRT_ShowHideColumnsButton table={table} />
            <ExportTableData
              dataToExport={
                groupMetadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR ?
                  [] : filteredData
              }
              exportCSVStatus={exportCSVStatus}
              setExportCSVStatus={setExportCSVStatus}
            />
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
