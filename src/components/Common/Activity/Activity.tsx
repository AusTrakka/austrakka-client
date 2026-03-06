import { Cancel } from '@mui/icons-material';
import { Alert, AlertTitle, Box, Paper, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { Column } from 'primereact/column';
import {
  DataTable,
  type DataTableRowClickEvent,
  type DataTableSelectEvent,
} from 'primereact/datatable';
import { useEffect, useState } from 'react';
import { Theme } from '../../../assets/themes/theme';
import useActivityLogs from '../../../hooks/useActivityLogs';
import type { DerivedLog } from '../../../types/dtos';
import {
  buildPrimeReactColumnDefinitions,
  type PrimeReactColumnDefinition,
} from '../../../utilities/tableUtils';
import sortIcon from '../../TableComponents/SortIcon';
import ActivityDetails from './ActivityDetails';
import ActivityFilters, { type Filters } from './ActivityFilters';
import { EVENT_NAME_COLUMN, supportedColumns } from './ActivityTableFields';
import type { ActivityDetailInfo } from './activityViewModels.interface';
import EmptyContentPane, { ContentIcon } from './EmptyContentPane';

interface ActivityProps {
  recordType: string;
  rGuid?: string;
}

const emptyDetailInfo: ActivityDetailInfo = {
  Event: '',
  'Time stamp': '',
  'Event initiated by': '',
  Resource: '',
  'Resource Type': '',
  Details: null,
};

function Activity({ recordType, rGuid }: ActivityProps): JSX.Element {
  const [columns, setColumns] = useState<PrimeReactColumnDefinition[]>([]);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedRow, setSelectedRow] = useState<DerivedLog | null>(null);
  const [detailInfo, setDetailInfo] = useState<ActivityDetailInfo>(emptyDetailInfo);
  const [loadingState, setLoadingState] = useState<boolean>(false);
  const [localLogs, setLocalLogs] = useState<DerivedLog[]>([]);
  const [filtersOpen, setFiltersOpen] = useState<boolean>(true);

  const today = dayjs();
  const lastWeek = dayjs().subtract(7, 'day');

  const [filters, setFilters] = useState<Filters>({
    startDate: lastWeek.toDate(),
    endDate: today.toDate(),
    resourceUniqueString: null,
    resourceType: null,
    eventType: null,
    submitterDisplayName: null,
  });

  const routeSegment = recordType === 'Tenant' ? recordType : `${recordType}V2`;

  const { refinedLogs, httpStatusCode, isLoadingErrorMsg, dataLoading } = useActivityLogs(
    routeSegment,
    filters,
    rGuid,
  );

  useEffect(() => {
    setLoadingState(dataLoading);
  }, [dataLoading]);

  useEffect(() => {
    setLocalLogs(refinedLogs);
  }, [refinedLogs]);

  useEffect(() => {
    if (columns.length > 0) return;

    const [firstCol] = supportedColumns.filter((c) => c.columnName === EVENT_NAME_COLUMN);
    const [firstColBuilder] = buildPrimeReactColumnDefinitions([firstCol]);
    firstColBuilder.isDecorated = true;
    const remainingCols = supportedColumns.filter((c) => c.columnName !== EVENT_NAME_COLUMN);
    const remainingColsBuilder = buildPrimeReactColumnDefinitions(remainingCols);
    const columnBuilder = [firstColBuilder];
    columnBuilder.push(...remainingColsBuilder);
    setColumns(columnBuilder);
  }, [columns.length]);

  const rowClickHandler = (event: DataTableRowClickEvent) => {
    const row = event.data;

    const info: ActivityDetailInfo = {
      Event: row[EVENT_NAME_COLUMN],
      'Time stamp': row.eventTime,
      'Event initiated by': row.submitterDisplayName,
      Resource: row.resourceUniqueString,
      'Resource Type': row.resourceType,
      Details: row.data || null,
    };
    setDetailInfo(info);
    setOpenDetails(true);
  };

  useEffect(() => {
    if (openDetails === false) {
      setSelectedRow(null);
    }
  }, [openDetails]);

  const onRowSelect = (e: DataTableSelectEvent) => {
    setSelectedRow(e.data);
  };

  const firstColumnTemplate = (rowData: any) =>
    rowData.eventStatus === 'Success' ? (
      <div>{rowData[EVENT_NAME_COLUMN]}</div>
    ) : (
      <span>
        <Cancel
          style={{
            marginRight: '10px',
            cursor: 'pointer',
            color: Theme.SecondaryRed,
            fontSize: '14px',
            verticalAlign: 'middle',
          }}
        />
        {rowData[EVENT_NAME_COLUMN]}
      </span>
    );

  const tableContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
      <ActivityDetails
        // onClose={closeDetailsHandler}
        drawerOpen={openDetails}
        setDrawerOpen={setOpenDetails}
        detailInfo={detailInfo}
      />
      <ActivityFilters
        isOpen={filtersOpen}
        setIsOpen={setFiltersOpen}
        filters={filters}
        setFilters={setFilters}
      />
      {httpStatusCode >= 400 && httpStatusCode !== 413 ? (
        <Alert severity="error" style={{ marginBottom: '20px' }}>
          <AlertTitle>Error</AlertTitle>
          {isLoadingErrorMsg || 'An error occurred while fetching the activity log.'}
        </Alert>
      ) : (
        <Paper elevation={2} sx={{ marginBottom: 1, flex: 1, minHeight: 0 }}>
          {dataLoading ? (
            <Box sx={{ p: 4 }}>
              <EmptyContentPane message="Loading activity logs." icon={ContentIcon.Loading} />
            </Box>
          ) : (
            <DataTable
              className="my-flexible-table"
              value={localLogs}
              onValueChange={() => {
                setLoadingState(false);
              }}
              size="small"
              columnResizeMode="expand"
              resizableColumns
              showGridlines
              reorderableColumns
              header={<div style={{ margin: '20px' }} />}
              removableSort
              scrollable
              sortIcon={sortIcon}
              scrollHeight="flex"
              paginator
              rows={500}
              rowsPerPageOptions={[500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000]}
              paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink JumpToPageDropDown"
              currentPageReportTemplate=" Viewing: {first} to {last} of {totalRecords}"
              paginatorPosition="bottom"
              paginatorRight
              loading={loadingState}
              onRowClick={rowClickHandler}
              selection={selectedRow}
              onRowSelect={onRowSelect}
              selectionMode="single"
              emptyMessage={
                httpStatusCode === 413 ? (
                  <Alert severity="error" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    <AlertTitle>Error</AlertTitle>
                    {isLoadingErrorMsg ||
                      'The activity log is too large to display. Please narrow your filters.'}
                  </Alert>
                ) : (
                  <Typography variant="subtitle1" color="textSecondary" align="center">
                    No activity found
                  </Typography>
                )
              }
            >
              <Column
                key={EVENT_NAME_COLUMN}
                field={EVENT_NAME_COLUMN}
                header="Event"
                hidden={false}
                body={firstColumnTemplate}
                sortable
                resizeable
                headerClassName="custom-title"
                className="flexible-column"
                bodyClassName="value-cells"
              />
              {columns
                ? columns
                    .filter((col: PrimeReactColumnDefinition) => col.field !== EVENT_NAME_COLUMN)
                    .map((col: any) => (
                      <Column
                        key={col.field}
                        field={col.field}
                        header={col.header}
                        hidden={false}
                        body={col.body}
                        sortable
                        resizeable
                        headerClassName="custom-title"
                        className="flexible-column"
                        bodyClassName="value-cells"
                      />
                    ))
                : null}
            </DataTable>
          )}
        </Paper>
      )}
    </Box>
  );

  // TODO: Need to fix this, this can be refactored differently
  let contentPane = <></>;
  if (httpStatusCode === 401 || httpStatusCode === 403) {
    contentPane = (
      <Alert severity="error">
        <AlertTitle>Permission Denied</AlertTitle>
        You do not have permission to view activity logs.
      </Alert>
    );
  } else if (!rGuid && recordType !== 'Tenant') {
    contentPane = (
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        Missing record information.
      </Alert>
    );
  } else {
    contentPane = tableContent;
  }

  return <>{contentPane}</>;
}

export default Activity;
