/* eslint-disable react/jsx-pascal-case */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-param-reassign */
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
import { DataTable, DataTableRowClickEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { MRT_PaginationState, MRT_SortingState } from 'material-react-table';
import { MetaDataColumn } from '../../types/dtos';
import { Sample } from '../../types/sample.interface';
import QueryBuilder, { Filter } from '../Common/QueryBuilder';
import LoadingState from '../../constants/loadingState';
import { replaceHasSequencesNullsWithFalse } from '../../utilities/helperUtils';
import { getDisplayFields, getSamples, getTotalSamples } from '../../utilities/resourceUtils';
import { buildPrimeReactColumnDefinitions, compareFields } from '../../utilities/tableUtils';
import { SAMPLE_ID_FIELD } from '../../constants/metadataConsts';
import { useApi } from '../../app/ApiContext';
import { ResponseObject } from '../../types/responseObject.interface';
import { ResponseType } from '../../constants/responseType';
import sortIcon from '../TableComponents/SortIcon';
import ColumnVisibilityMenu from '../TableComponents/ColumnVisibilityMenu';
import ExportTableData from '../Common/ExportTableData';

interface SamplesProps {
  groupContext: number | undefined,
  groupName: string | undefined,
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
  const { groupContext, groupName } = props;
  const csvLink = useRef<CSVLink & HTMLAnchorElement & { link: HTMLAnchorElement }>(null);
  const [sampleTableColumns, setSampleTableColumns] = useState<any>([]);
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [samplesPagination, setSamplesPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
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
  const [displayFields, setDisplayFields] = useState<MetaDataColumn[]>([]);
  const { token, tokenLoading } = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    async function getFields() {
      const filterFieldsResponse: ResponseObject = await getDisplayFields(groupContext!, token);
      if (filterFieldsResponse.status === ResponseType.Success) {
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
      const totalSamplesResponse: ResponseObject = await getTotalSamples(groupContext!, token);
      if (totalSamplesResponse.status === ResponseType.Success) {
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
    if (groupContext !== undefined &&
      tokenLoading !== LoadingState.LOADING &&
      tokenLoading !== LoadingState.IDLE) {
      setIsSamplesLoading(true);
      getFields();
      getTotalSamplesOverall();
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
          filters: queryString,
          sorts: sortString,
        });
        const samplesResponse: ResponseObject =
          await getSamples(token, groupContext!, searchParams);
        if (samplesResponse.status === ResponseType.Success) {
          // changing null values in Has_sequences to false this is a temporary fix. As
          // most data will be retrieved by redux and this will be handled there.
          const sampleDataAltered = replaceHasSequencesNullsWithFalse(samplesResponse.data);
          setSampleList(sampleDataAltered);
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
      if (sampleTableColumns.length > 0 &&
        tokenLoading !== LoadingState.LOADING &&
        tokenLoading !== LoadingState.IDLE) {
        getSamplesList();
      } else {
        setSampleList([]);
        setIsSamplesLoading(false);
      }
    },
    [groupContext, samplesPagination.pageIndex, samplesPagination.pageSize,
      sampleTableColumns, queryString, sorting, token, tokenLoading],
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

  // GET SAMPLES - not paginated
  const getExportData = async () => {
    if (groupContext) {
      setExportCSVStatus(LoadingState.LOADING);
      const searchParams = new URLSearchParams({
        Page: '1',
        PageSize: (totalSamples).toString(),
        filters: queryString,
      });
      const samplesResponse: ResponseObject = await getSamples(token, groupContext, searchParams);
      if (samplesResponse.status === ResponseType.Success) {
        setExportData(samplesResponse.data);
      } else {
        setExportCSVStatus(LoadingState.ERROR);
      }
    }
  };

  const handleDialogClose = () => {
    setExportCSVStatus(LoadingState.IDLE);
  };
  const totalSamplesDisplay = `Total unfiltered records: ${totalSamples.toLocaleString('en-us')}`;

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
          dataToExport={sampleList}
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
      <Paper elevation={2} sx={{ marginBottom: 10 }}>
        <DataTable
          value={sampleList}
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
