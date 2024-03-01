/* eslint-disable react/jsx-pascal-case */
import 'primereact/resources/themes/md-light-indigo/theme.css';
import React, {
  memo, useEffect, SetStateAction, useState,
} from 'react';
import { FilterList, Close } from '@mui/icons-material';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {
  Box, IconButton, Tooltip, Typography,
  CircularProgress, Dialog,
  Backdrop, Alert, AlertTitle, Badge,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LoadingState from '../../constants/loadingState';
import { SAMPLE_ID_FIELD } from '../../constants/metadataConsts';
import DataFilters, { DataFilter } from '../DataFilters/DataFilters';
import { ProjectMetadataState, selectProjectMetadata } from '../../app/projectMetadataSlice';
import { buildMRTColumnDefinitions, buildPrimeReactColumnDefinitions } from '../../utilities/tableUtils';
import MetadataLoadingState from '../../constants/metadataLoadingState';
import ExportTableData from '../Common/ExportTableData';
import { Sample } from '../../types/sample.interface';
import { useAppSelector } from '../../app/store';

interface SamplesProps {
  projectAbbrev: string,
  totalSamples: number,
  isSamplesLoading: boolean,
  inputFilters: SetStateAction<DataFilter[]>,
}

function Samples(props: SamplesProps) {
  const {
    projectAbbrev,
    totalSamples,
    isSamplesLoading,
    inputFilters,
  } = props;
  const navigate = useNavigate();

  const [sampleTableColumns, setSampleTableColumns] = useState<Sample[]>([]);
  const [exportCSVStatus, setExportCSVStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  const metadata : ProjectMetadataState | null =
    useAppSelector(state => selectProjectMetadata(state, projectAbbrev));

  console.log('metadata', metadata);
  // Set column headers from metadata state
  useEffect(() => {
    if (!metadata?.fields) return;
    const columnBuilder = buildPrimeReactColumnDefinitions(metadata!.fields!);
    setSampleTableColumns(columnBuilder);
  }, [metadata]);

  // Open error dialog if loading state changes to error
  useEffect(() => {
    if (metadata?.loadingState === MetadataLoadingState.ERROR ||
        metadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR) {
      setErrorDialogOpen(true);
    }
  }, [metadata?.loadingState]);

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
      metadata?.loadingState === MetadataLoadingState.IDLE ||
      metadata?.loadingState === MetadataLoadingState.AWAITING_DATA ||
      metadata?.loadingState === MetadataLoadingState.PARTIAL_DATA_LOADED ?
        LoadingState.LOADING :
        LoadingState.SUCCESS,
    );
  }, [isSamplesLoading, metadata?.loadingState]);

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
              {metadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR ?
                'Project metadata could not be fully loaded' :
                'Project metadata could not be loaded'}
            </strong>
          </AlertTitle>
          {metadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR ?
            `An error occured loading project metadata. Some fields will be null, and 
          CSV export will not be available. Refresh to reload.` :
            'An error occured loading project metadata. Refresh to reload.'}
          <br />
          Please contact an AusTrakka admin if this error persists.
        </Alert>
      </Dialog>
      {/* <DataFilters
        data={metadata?.metadata ?? []}
        fields={metadata?.fields ?? []} // want to pass in field loading states?
        setFilteredData={setFilteredData}
        isOpen={isDataFiltersOpen}
        setIsOpen={setIsDataFiltersOpen}
        filterList={filterList}
        setFilterList={setFilterList}
      /> */}
      <DataTable
        value={metadata?.metadata ?? []}
        scrollable
        paginator
        rows={15}
        resizableColumns
        showGridlines
        columnResizeMode="expand"
        rowsPerPageOptions={[15, 50, 100, 500]}
      >
        {sampleTableColumns.map((col) => (
          <Column
            key={col.field}
            field={col.field}
            header={col.header}
            body={col.body}
          />
        ))}
      </DataTable>
    </>
  );
}
export default memo(Samples);
