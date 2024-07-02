/* eslint-disable react/jsx-pascal-case */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {
  memo, useEffect, useRef, useState,
} from 'react';

import { Close } from '@mui/icons-material';
import {
  IconButton,
  CircularProgress, Dialog,
  Backdrop, Alert, AlertTitle, Paper,
} from '@mui/material';
import { CSVLink } from 'react-csv';
import { useNavigate } from 'react-router-dom';
import { DataTable, DataTableFilterMeta, DataTableOperatorFilterMetaData, DataTableRowClickEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FilterMatchMode } from 'primereact/api';
import { MetaDataColumn } from '../../types/dtos';
import { Sample } from '../../types/sample.interface';
import { Filter } from '../Common/QueryBuilder';
import LoadingState from '../../constants/loadingState';
import { convertDataTableFilterMetaToDataFilterObject, isEqual, replaceHasSequencesNullsWithFalse, useStateFromSearchParamsForFilterObject } from '../../utilities/helperUtils';
import { getDisplayFields, getSamples } from '../../utilities/resourceUtils';
import { buildPrimeReactColumnDefinitions, compareFields } from '../../utilities/tableUtils';
import { SAMPLE_ID_FIELD } from '../../constants/metadataConsts';
import { useApi } from '../../app/ApiContext';
import { ResponseType } from '../../constants/responseType';
import sortIcon from '../TableComponents/SortIcon';
import ColumnVisibilityMenu from '../TableComponents/ColumnVisibilityMenu';
import ExportTableData from '../Common/ExportTableData';
import DataFilters from '../DataFilters/DataFilters';

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
  const csvLink = useRef<CSVLink & HTMLAnchorElement & { link: HTMLAnchorElement }>(null);
  const [sampleTableColumns, setSampleTableColumns] = useState<any>([]);
  const [isSamplesLoading, setIsSamplesLoading] = useState(false);
  const [sampleList, setSampleList] = useState<Sample[]>([]);
  const [filteredSampleList, setFilteredSampleList] = useState<Sample[]>([]);
  const [totalSamplesCount, setTotalSamplesCount] = useState(0);
  const [isSamplesError, setIsSamplesError] = useState({
    samplesHeaderError: false,
    samplesTotalError: false,
    sampleMetadataError: false,
    samplesErrorMessage: '',
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filterList, setFilterList] = useState<Filter[]>([]);
  const [exportCSVStatus, setExportCSVStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [exportData, setExportData] = useState<Sample[]>([]);
  const [displayFields, setDisplayFields] = useState<MetaDataColumn[]>([]);
  const defualtState = { global:
    { operator: 'and',
      constraints: [{ value: null,
        matchMode: FilterMatchMode.CONTAINS }] } as DataTableOperatorFilterMetaData };
  const [currentFilters, setCurrentFilters] = useStateFromSearchParamsForFilterObject(
    'filters',
    defualtState,
  );
  const { token, tokenLoading } = useApi();
  const navigate = useNavigate();

  useEffect(
    () => {
      if (filterList.length === 0
         && !isEqual(currentFilters, defualtState)) {
        setFilterList(convertDataTableFilterMetaToDataFilterObject(
          currentFilters,
          displayFields,
        ));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentFilters, displayFields, filterList],
  );

  useEffect(() => {
    async function fetchSamplesData() {
      setIsSamplesLoading(true);
      try {
        // Fetch display fields
        const filterFieldsResponse = await getDisplayFields(groupContext!, token);
        if (filterFieldsResponse.status === ResponseType.Success) {
          setDisplayFields(filterFieldsResponse.data);
        } else {
          setIsSamplesError((prevState) => ({
            ...prevState,
            samplesHeaderError: true,
            samplesErrorMessage: filterFieldsResponse.message,
          }));
        }

        // Fetch all samples data and total count
        const samplesResponse = await getSamples(token, groupContext!);
        if (samplesResponse.status === ResponseType.Success) {
          const sampleDataAltered = replaceHasSequencesNullsWithFalse(samplesResponse.data);
          setSampleList(sampleDataAltered);
          setFilteredSampleList(sampleDataAltered);
          setIsSamplesError((prevState) => ({
            ...prevState,
            sampleMetadataError: false,
          }));
          const count: string = samplesResponse.headers?.get('X-Total-Count')!;
          setTotalSamplesCount(+count);
        } else {
          setIsSamplesError((prevState) => ({
            ...prevState,
            sampleMetadataError: true,
            samplesErrorMessage: samplesResponse.message,
          }));
          setSampleList([]);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching samples data:', error);
        setIsSamplesError((prevState) => ({
          ...prevState,
          samplesHeaderError: true,
          samplesTotalError: true,
          sampleMetadataError: true,
          samplesErrorMessage: 'Error fetching samples data',
        }));
      } finally {
        setIsSamplesLoading(false);
      }
    }

    if (groupContext !== undefined &&
      tokenLoading !== LoadingState.LOADING &&
      tokenLoading !== LoadingState.IDLE) {
      fetchSamplesData();
    }
  }, [groupContext, token, tokenLoading]);

  useEffect(
    () => {
      // BUILD COLUMNS
      const formatTableHeaders = () => {
        const sortedDisplayFields = [...displayFields];
        sortedDisplayFields.sort(compareFields);
        const columnBuilder = buildPrimeReactColumnDefinitions(sortedDisplayFields);
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

  const rowClickHandler = (row: DataTableRowClickEvent) => {
    const selectedRow = row.data;
    if (SAMPLE_ID_FIELD in selectedRow) {
      const sampleId = selectedRow[SAMPLE_ID_FIELD];
      const url = `/records/${sampleId}`;
      navigate(url);
    } else {
      // eslint-disable-next-line no-console
      console.error(`${SAMPLE_ID_FIELD} not found in selectedRow.`);
    }
  };

  const handleDialogClose = () => {
    setExportCSVStatus(LoadingState.IDLE);
  };

  const header = (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
        />
        <ExportTableData
          dataToExport={filteredSampleList}
          disabled={false}
        />
      </div>
    </div>
  );
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
      <DataFilters
        dataLength={totalSamplesCount ?? 0}
        filteredDataLength={filteredSampleList.length}
        visibleFields={sampleTableColumns}
        allFields={displayFields ?? []} // want to pass in field loading states?
        setPrimeReactFilters={setCurrentFilters}
        isOpen={isFiltersOpen}
        setIsOpen={setIsFiltersOpen}
        filterList={filterList}
        setFilterList={setFilterList}
        setLoadingState={setIsSamplesLoading}
      />
      <Paper elevation={2} sx={{ marginBottom: 10 }}>
        <DataTable
          value={sampleList}
          onValueChange={(e) => {
            setFilteredSampleList(e);
          }}
          filters={currentFilters}
          size="small"
          columnResizeMode="expand"
          resizableColumns
          showGridlines
          reorderableColumns
          removableSort
          header={header}
          scrollable
          scrollHeight="calc(100vh - 500px)"
          sortIcon={sortIcon}
          paginator
          onRowClick={rowClickHandler}
          selectionMode="single"
          rows={25}
          loading={isSamplesLoading}
          rowsPerPageOptions={[25, 50, 100, 500]}
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink JumpToPageDropDown"
          currentPageReportTemplate=" Viewing: {first} to {last} of {totalRecords}"
          paginatorPosition="bottom"
          paginatorRight
        >
          {sampleTableColumns.map((col: any) => (
            <Column
              key={col.field}
              field={col.field}
              header={col.header}
              body={col.body}
              hidden={col.hidden ?? false}
              sortable
              resizeable
              style={{ minWidth: '150px' }}
              headerClassName="custom-title"
            />
          ))}
        </DataTable>
      </Paper>
    </>
  );
}
export default memo(SampleTable);
