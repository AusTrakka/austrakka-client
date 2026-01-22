import React, { useEffect, useState } from 'react';
import {
  DataTable,
  DataTableRowClickEvent,
  DataTableRowDataArray,
  DataTableSelectEvent,
} from 'primereact/datatable';
import { Alert, AlertTitle, Paper, Typography } from '@mui/material';
import { Column } from 'primereact/column';
import { Cancel } from '@mui/icons-material';
import { ActivityDetailInfo } from './activityViewModels.interface';
import ActivityDetails from './ActivityDetails';
import { DerivedLog } from '../../../types/dtos';
import useActivityLogs from '../../../hooks/useActivityLogs';
import { buildPrimeReactColumnDefinitions, PrimeReactColumnDefinition } from '../../../utilities/tableUtils';
import DataFilters, { defaultState } from '../../DataFilters/DataFilters';
import sortIcon from '../../TableComponents/SortIcon';
import { Theme } from '../../../assets/themes/theme';
import EmptyContentPane, { ContentIcon } from './EmptyContentPane';
import { useStateFromSearchParamsForFilterObject } from '../../../utilities/stateUtils';
import { useStableNavigate } from '../../../app/NavigationContext';
import { supportedColumns, EVENT_NAME_COLUMN } from './ActivityTableFields';

interface ActivityProps {
  recordType: string,
  rGuid?: string,
}

const emptyDetailInfo: ActivityDetailInfo = {
  'Event': '',
  'Time stamp': '',
  'Event initiated by': '',
  'Resource': '',
  'Resource Type': '',
  'Details': null,
};

function Activity({ recordType, rGuid }: ActivityProps): JSX.Element {
  const { navigate } = useStableNavigate();
  const [columns, setColumns] = useState<PrimeReactColumnDefinition[]>([]);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedRow, setSelectedRow] = useState<DerivedLog | null>(null);
  const [detailInfo, setDetailInfo] = useState<ActivityDetailInfo>(emptyDetailInfo);
  const [loadingState, setLoadingState] = useState<boolean>(false);
  const [localLogs, setLocalLogs] = useState<DerivedLog[]>([]);
  const [isDataFiltersOpen, setIsDataFiltersOpen] = useState<boolean>(true);
  const [filteredDataLength, setFilteredDataLength] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useStateFromSearchParamsForFilterObject(
    'filter',
    defaultState,
    navigate,
  );

  const routeSegment = recordType === 'Tenant'
    ? recordType
    : `${recordType}V2`;

  const {
    refinedLogs,
    httpStatusCode,
    dataLoading,
  } = useActivityLogs(routeSegment, rGuid);

  useEffect(() => {
    setLoadingState(dataLoading);
  }, [dataLoading]);

  useEffect(() => {
    setLocalLogs(refinedLogs);
    setFilteredDataLength(refinedLogs.length);
  }, [refinedLogs]);

  useEffect(() => {
    if (columns.length > 0) return;

    const firstCol = supportedColumns.filter(c => c.columnName === EVENT_NAME_COLUMN)[0];
    const firstColBuilder = buildPrimeReactColumnDefinitions([firstCol])[0];
    firstColBuilder.isDecorated = true;
    const remainingCols = supportedColumns.filter(c => c.columnName !== EVENT_NAME_COLUMN);
    const remainingColsBuilder = buildPrimeReactColumnDefinitions(remainingCols);
    const columnBuilder = [firstColBuilder];
    columnBuilder.push(...remainingColsBuilder);
    setColumns(columnBuilder);
  }, [recordType, rGuid, columns.length]);

  const rowClickHandler = (event: DataTableRowClickEvent) => {
    const row = event.data;

    const info: ActivityDetailInfo = {
      'Event': row[EVENT_NAME_COLUMN],
      'Time stamp': row.eventTime,
      'Event initiated by': row.submitterDisplayName,
      'Resource': row.resourceUniqueString,
      'Resource Type': row.resourceType,
      'Details': row.data || null,
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

  // TODO: very similar logic can be used to expand/collapse bundled logs when re-implemented
  // 
  // const toggleRow = (e: DataTableRowToggleEvent) => {
  //   const row = (e.data as any[])[0] as Log;
  //
  //   const firstChildIdx = localLogs.findIndex((node) =>
  //     node.aggregationMemberKey
  //           && row.aggregationKey
  //           && node.aggregationMemberKey === row.aggregationKey);
  //
  //   const clonedRows = [...localLogs];
  //
  //   if (firstChildIdx === -1) {
  //     // Add
  //     const rowIdx = localLogs.indexOf(row);
  //     // Insert row.children at position rowIdx + 1
  //     clonedRows.splice(rowIdx + 1, 0, ...row.children ?? []);
  //   } else {
  //     // Remove
  //     // Traverse the tree of row recursively to find all the descendants.
  //     // Compile the nodes into a flat array. Using this information, remove
  //     // each member of the array from currentRows.
  //     const targets: Log[] = [];
  //
  //     const findDescendants = (node: Log) => {
  //       targets.push(node);
  //       node.children?.forEach((child) => findDescendants(child));
  //     };
  //
  //     if (row.children) {
  //       for (let i = 0; i < row.children.length; i++) {
  //         findDescendants(row.children[i]);
  //       }
  //     }
  //
  //     // Remove the targets from the currentRows
  //     targets.forEach((target) => {
  //       const idx = clonedRows.indexOf(target);
  //       if (idx !== -1) {
  //         clonedRows.splice(idx, 1);
  //       }
  //     });
  //   }
  //   setLocalLogs(clonedRows);
  // };

  const firstColumnTemplate = (rowData: any) => (
    rowData.eventStatus === 'Success'
      ? (
        <div>
          {rowData[EVENT_NAME_COLUMN]}
        </div>
      )
      : (
        <span>
          <Cancel style={{
            marginRight: '10px',
            cursor: 'pointer',
            color: Theme.SecondaryRed,
            fontSize: '14px',
            verticalAlign: 'middle',
          }}
          />
          {rowData[EVENT_NAME_COLUMN]}
        </span>
      )
  );

  const tableContent = (
    <>
      <ActivityDetails
        // onClose={closeDetailsHandler}
        drawerOpen={openDetails}
        setDrawerOpen={setOpenDetails}
        detailInfo={detailInfo}
      />
      <DataFilters
        dataLength={localLogs.length ?? 0}
        filteredDataLength={filteredDataLength}
        visibleFields={columns}
        allFields={supportedColumns}
        fieldUniqueValues={null}
        setPrimeReactFilters={setCurrentFilters}
        primeReactFilters={currentFilters}
        isOpen={isDataFiltersOpen}
        setIsOpen={setIsDataFiltersOpen}
        dataLoaded={!loadingState}
        setLoadingState={setLoadingState}
      />
      <Paper elevation={2} sx={{ marginBottom: 10 }}>
        <DataTable
          className="my-flexible-table"
          value={localLogs}
          onValueChange={(e: DataTableRowDataArray<DerivedLog[]>) => {
            setFilteredDataLength(e.length);
            setLoadingState(false);
          }}
          filters={loadingState ? defaultState : currentFilters}
          size="small"
          columnResizeMode="expand"
          resizableColumns
          showGridlines
          reorderableColumns
          header={<div style={{ margin: '20px' }} />}
          removableSort
          scrollable
          sortIcon={sortIcon}
          scrollHeight="calc(100vh - 400px)"
          paginator
          loading={loadingState}
          onRowClick={rowClickHandler}
          selection={selectedRow}
          onRowSelect={onRowSelect}
          // onRowToggle={toggleRow}
          selectionMode="single"
          rows={25}
          rowsPerPageOptions={[25, 50, 100, 500, 2000]}
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink JumpToPageDropDown"
          currentPageReportTemplate=" Viewing: {first} to {last} of {totalRecords}"
          paginatorPosition="bottom"
          paginatorRight
          emptyMessage={(
            <Typography variant="subtitle1" color="textSecondary" align="center">
              No activity found
            </Typography>
          )}
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
          {columns ? columns.filter((col: PrimeReactColumnDefinition) =>
            col.field !== EVENT_NAME_COLUMN)
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
            )) : null}
        </DataTable>
      </Paper>
    </>
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
  } else if (httpStatusCode >= 400) {
    contentPane = (
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        An error occurred while fetching the activity log.
      </Alert>
    );
  } else if (!rGuid && recordType !== 'Tenant') {
    contentPane = (
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        Missing record information.
      </Alert>
    );
  } else if (dataLoading) {
    contentPane = <EmptyContentPane message="Loading activity logs." icon={ContentIcon.Loading} />;
  } else {
    contentPane = refinedLogs.length > 0
      ? tableContent
      : <EmptyContentPane message="There is no activity to show." icon={ContentIcon.InTray} />;
  }

  return (
    <>
      {contentPane}
    </>
  );
}

export default Activity;
