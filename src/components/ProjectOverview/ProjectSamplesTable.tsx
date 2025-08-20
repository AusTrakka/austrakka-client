/* eslint-disable react/jsx-pascal-case */

import React, {
  memo, useCallback,
  useEffect, useMemo, useState,
} from 'react';
import { Close, InfoOutlined, TextRotateUp, TextRotateVertical } from '@mui/icons-material';
import { DataTable, DataTableRowClickEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {
  IconButton,
  Dialog,
  Alert, AlertTitle, Paper, Tooltip,
  Typography,
} from '@mui/material';
import './Samples.css';
import { Skeleton } from 'primereact/skeleton';
import LoadingState from '../../constants/loadingState';
import { SAMPLE_ID_FIELD } from '../../constants/metadataConsts';
import DataFilters, { defaultState } from '../DataFilters/DataFilters';
import { ProjectMetadataState, selectProjectMetadata } from '../../app/projectMetadataSlice';
import { buildPrimeReactColumnDefinitionsPVF } from '../../utilities/tableUtils';
import MetadataLoadingState from '../../constants/metadataLoadingState';
import { Sample } from '../../types/sample.interface';
import { useAppSelector } from '../../app/store';
import ExportTableData from '../Common/ExportTableData';
import ColumnVisibilityMenu from '../TableComponents/ColumnVisibilityMenu';
import useMaxHeaderHeight from '../TableComponents/UseMaxHeight';
import sortIcon from '../TableComponents/SortIcon';
import KeyValuePopOver from '../TableComponents/KeyValuePopOver';
import { ProjectField } from '../../types/dtos';
import { useStateFromSearchParamsForFilterObject } from '../../utilities/stateUtils';
import { useStableNavigate } from '../../app/NavigationContext';

interface SamplesProps {
  projectAbbrev: string,
  isSamplesLoading: boolean,
}

interface BodyComponentProps {
  col: Sample,
  readyFields: Record<string, LoadingState> | undefined,
}
  
function BodyComponent(props: BodyComponentProps) {
  const { col, readyFields } = props;
  return !readyFields || readyFields[col.field] !== LoadingState.SUCCESS ? (
    <Skeleton /> // Replace with your skeleton component
  ) : (
    col.body// Wrap your existing body content
  );
}

function ProjectSamplesTable(props: SamplesProps) {
  const {
    projectAbbrev,
    isSamplesLoading,
  } = props;
  
  const { navigate } = useStableNavigate();
  const [sampleTableColumns, setSampleTableColumns] = useState<any>([]);
  const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);
  const [currentFilters, setCurrentFilters] = useStateFromSearchParamsForFilterObject(
    'filters',
    defaultState,
    navigate,
  );
  const [filteredData, setFilteredData] = useState<Sample[]>([]);
  const [isDataFiltersOpen, setIsDataFiltersOpen] = useState(true);

  const [loadingState, setLoadingState] = useState<boolean>(false);
  const [verticalHeaders, setVerticalHeaders] = useState<boolean>(false);
  const [allFieldsLoaded, setAllFieldsLoaded] = useState<boolean>(false);
  const [filteredDataLength, setFilteredDataLength] =
    useState<number>(0);

  const metadata: ProjectMetadataState | null =
    useAppSelector(state => selectProjectMetadata(state, projectAbbrev));
  const { maxHeight, getHeaderRef } =
    useMaxHeaderHeight(metadata?.loadingState ?? MetadataLoadingState.IDLE);
  // Set column headers from metadata state
  useEffect(() => {
    if (!metadata?.fields || !metadata?.fieldLoadingStates) return;
    const columnBuilder = buildPrimeReactColumnDefinitionsPVF(metadata.fields);
    if (Object.values(metadata.fieldLoadingStates).every(field => field === LoadingState.SUCCESS)) {
      setAllFieldsLoaded(true);
    }
    setSampleTableColumns(columnBuilder);
    setFilteredDataLength(metadata.metadata?.length ?? 0);
  }, [metadata?.fields, metadata?.fieldLoadingStates, metadata?.metadata?.length]);

  // Open error dialog if loading state changes to error
  useEffect(() => {
    if (metadata?.loadingState === MetadataLoadingState.ERROR ||
      metadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR) {
      setErrorDialogOpen(true);
    }
  }, [metadata?.loadingState]);
  
  const rowClickHandler = (event: DataTableRowClickEvent) => {
    const selectedRow = event.data as Sample;
    if (SAMPLE_ID_FIELD in selectedRow) {
      navigate(`/projects/${projectAbbrev}/records/${selectedRow[SAMPLE_ID_FIELD]}`);
    }
  };

  useEffect(() => {
    if (metadata?.loadingState === MetadataLoadingState.DATA_LOADED) {
      setFilteredData(metadata?.metadata!);
    }
  }, [metadata?.loadingState, metadata?.metadata]);

  const getFieldSource = (field: string) => {
    const fieldObj = metadata?.fields?.find(f => f.columnName === field);
    return `${fieldObj?.fieldSource}`;
  };

  const header = (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <KeyValuePopOver
          data={metadata?.projectFields || []}
          keyExtractor={(field: ProjectField) => field.fieldName}
          valueExtractor={(field: ProjectField) => field.fieldSource}
          valueFormatter={(value: string) => value.replace(/^Source From\s*/i, '')}
          searchPlaceholder="Search by field..."
          toolTipTitle="Show Field Sources"
        />
        <ColumnVisibilityMenu
          columns={sampleTableColumns}
          onColumnVisibilityChange={(selectedCols) => {
            const newColumns = sampleTableColumns.map((col: any) => {
              const newCol = { ...col };
              newCol.hidden = selectedCols.some(
                (selectedCol: any) => selectedCol.field === col.field,
              );
              return newCol;
            });
            setSampleTableColumns(newColumns);
          }}
          emptyColumnNames={metadata?.emptyColumns ?? null}
        />
        <Tooltip title="Toggle Vertical Headers" placement="top">
          <IconButton
            onClick={() => setVerticalHeaders(!verticalHeaders)}
            aria-label="toggle vertical headers"
          >
            {verticalHeaders ? <TextRotateVertical /> : <TextRotateUp />}
          </IconButton>
        </Tooltip>
        <ExportTableData
          dataToExport={
            metadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR
              ? []
              : filteredData ?? []
          }
          disabled={metadata?.loadingState !== MetadataLoadingState.DATA_LOADED}
        />
      </div>
    </div>
  );

  if (isSamplesLoading) return null;
  return (
    <div className="datatable-container-proj">
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
          Please contact the
          {' '}
          {import.meta.env.VITE_BRANDING_NAME}
          {' '}
          team if this error persists.
        </Alert>
      </Dialog>
      <DataFilters
        dataLength={metadata?.metadata?.length ?? 0}
        filteredDataLength={filteredDataLength}
        visibleFields={sampleTableColumns}
        allFields={metadata?.fields ?? []} // want to pass in field loading states?
        fieldUniqueValues={metadata?.fieldUniqueValues ?? null}
        setPrimeReactFilters={setCurrentFilters}
        isOpen={isDataFiltersOpen}
        setIsOpen={setIsDataFiltersOpen}
        dataLoaded={allFieldsLoaded}
        setLoadingState={setLoadingState} // TODO: This is a hack to get the filters to update
        primeReactFilters={currentFilters}
      />
      {
        /* TODO: Make a function for the table so that a different sort is used per column type */
      }
      <Paper elevation={2} sx={{ marginBottom: 1, flex: 1, minHeight: 0 }}>
        <DataTable
          value={metadata?.metadata ?? []}
          onValueChange={(e) => {
            setFilteredDataLength(e.length);
            setLoadingState(false);
            setFilteredData(e);
          }}
          size="small"
          removableSort
          showGridlines
          scrollable
          scrollHeight="flex"
          paginator
          loading={loadingState}
          rows={25}
          columnResizeMode="expand"
          rowsPerPageOptions={[25, 50, 100, 500, 2000]}
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink JumpToPageDropDown"
          currentPageReportTemplate=" Viewing: {first} to {last} of {totalRecords}"
          paginatorPosition="bottom"
          paginatorRight
          header={header}
          onRowClick={rowClickHandler}
          selectionMode="single"
          className={verticalHeaders ? 'vertical-table-mode' : 'my-flexible-table'}
          filters={allFieldsLoaded ?
            currentFilters :
            defaultState}
          reorderableColumns
          resizableColumns
          sortIcon={sortIcon}
          emptyMessage={(
            <Typography variant="subtitle1" color="textSecondary" align="center">
              No samples found
            </Typography>
            )}
        >
          {metadata?.metadata ? sampleTableColumns.map((col: any, index: any) => (
            <Column
              key={col.field}
              field={col.field}
              header={
                  !verticalHeaders ? (
                    <div style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center' }}>
                      {col.header}
                      <Tooltip title={getFieldSource(col.field)} placement="top">
                        <InfoOutlined fontSize="inherit" color="disabled" style={{ margin: 5 }} />
                      </Tooltip>
                    </div>
                  ) : (
                    <div ref={(ref) => getHeaderRef(ref, index)} className="custom-vertical-header">
                      <span className="vertical-text">{col.header}</span>
                      <Tooltip title={getFieldSource(col.field)} placement="top">
                        <InfoOutlined fontSize="inherit" color="disabled" style={{ marginBottom: 4 }} />
                      </Tooltip>
                    </div>
                  )
                }
              body={BodyComponent({ col, readyFields: metadata?.fieldLoadingStates })}
              hidden={col.hidden}
              sortable
              resizeable
              headerStyle={verticalHeaders ?
                { maxHeight: `${maxHeight}px`, width: `${maxHeight}px` } :
                { width: `${maxHeight}px` }}
              headerClassName="custom-title"
              className="flexible-column"
              bodyClassName="value-cells"
            />
          )) : null}
        </DataTable>
      </Paper>
    </div>
  );
}

ProjectSamplesTable.whyDidYouRender = true;
export default memo(ProjectSamplesTable);
