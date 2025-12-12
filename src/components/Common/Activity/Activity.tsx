import React, { useEffect, useState } from 'react';
import {
  DataTable,
  DataTableRowClickEvent,
  DataTableSelectEvent,
} from 'primereact/datatable';
import { Alert, AlertTitle, Paper, Typography } from '@mui/material';
import { Column } from 'primereact/column';
import { Cancel, Info } from '@mui/icons-material';
import { ActivityDetailInfo } from './activityViewModels.interface';
import ActivityDetails from './ActivityDetails';
import { ActivityField, DerivedLog } from '../../../types/dtos';
import useActivityLogs from '../../../hooks/useActivityLogs';
import { buildPrimeReactColumnDefinitions, PrimeReactColumnDefinition } from '../../../utilities/tableUtils';
import FriendlyHeader from '../../../types/friendlyHeader.interface';
import TableToolbar from './TableToolbar';
import EmptyContentPane, { ContentIcon } from '../EmptyContentPane';
import {defaultState} from "../../DataFilters/DataFilters";

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

const EVENT_NAME_COLUMN: string = 'eventType';

export const supportedColumns: ActivityField[] = [
  {
    columnName: EVENT_NAME_COLUMN,
    columnDisplayName: 'Event',
    primitiveType: 'string',
    columnOrder: 1,
    hidden: false,
  },
  {
    columnName: 'eventStatus',
    columnDisplayName: 'Status',
    primitiveType: 'string',
    columnOrder: 2,
    hidden: false,
  },
  {
    columnName: 'resourceUniqueString',
    columnDisplayName: 'Resource',
    primitiveType: 'string',
    columnOrder: 3,
    hidden: false,
  },
  {
    columnName: 'resourceType',
    columnDisplayName: 'Resource type',
    primitiveType: 'string',
    columnOrder: 4,
    hidden: false,
  },
  {
    columnName: 'eventTime',
    columnDisplayName: 'Time stamp',
    primitiveType: 'date',
    columnOrder: 5,
    hidden: false,
  },
  {
    columnName: 'submitterDisplayName',
    columnDisplayName: 'Event initiated by',
    primitiveType: 'string',
    columnOrder: 6,
    hidden: false,
  },
];

function Activity({ recordType, rGuid }: ActivityProps): JSX.Element {
  const [columns, setColumns] = useState<any[]>([]);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedRow, setSelectedRow] = useState<DerivedLog | null>(null);
  const [detailInfo, setDetailInfo] = useState<ActivityDetailInfo>(emptyDetailInfo);
  const [localLogs, setLocalLogs] = useState<DerivedLog[]>([]);
  
  const routeSegment = recordType === 'Tenant'
    ? recordType
    : `${recordType}V2`;
  
  const {
    refinedLogs,
    httpStatusCode,
    dataLoading,
  } = useActivityLogs(routeSegment, rGuid ?? '');

  const transformData = (data: DerivedLog[]): DerivedLog[] =>
    // This previously aggregated logs by aggregation keys, which no longer exist
    // Currently a placeholder for client-side log transforms
    data;
  useEffect(() => {
    if (refinedLogs.length > 0) {
      const transformedData = transformData(refinedLogs);
      setLocalLogs(transformedData);
    }
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
      'Details': row.displayJsonData || null,
    };
    setDetailInfo(info);
    setOpenDetails(true);
  };
    
  const closeDetailsHandler = () => {
    setOpenDetails(false);
    setSelectedRow(null);
  };

  const onRowSelect = (e: DataTableSelectEvent) => {
    setSelectedRow(e.data);
  };

  // TODO very similar logic can be used to expand/collapse bundled logs when re-implemented
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
    
  const friendlyHeaders: FriendlyHeader[] = supportedColumns
    .sort((a, b) => a.columnOrder - b.columnOrder)
    .map((col) => ({ name: col.columnName, displayName: col.columnDisplayName || col.columnName }));
    
  const header = (
    <TableToolbar
      filteredData={refinedLogs}
      rowDataHeaders={friendlyHeaders}
      showDisplayHeader
      showExportButton={refinedLogs.length > 0}
    />
  );

  const getIndentStyle = (level: number) => ({
    paddingLeft: `${level * 25}px`, // Indent by 20px per level
    display: 'inline-flex', // Use inline-flex to align both the icon and the ID in a row
    alignItems: 'center',
  });

  const firstColumnTemplate = (rowData: any) => (
    rowData.eventStatus === 'Success'
      ? (
        <span style={getIndentStyle(rowData.level ?? 0)}>
          <Info style={{
            marginRight: '10px',
            cursor: 'pointer',
            color: 'rgb(21,101,192)',
            fontSize: '14px',
            verticalAlign: 'middle',
          }}
          />
          {rowData[EVENT_NAME_COLUMN]}
        </span>
      )
                
      : (
        <span style={getIndentStyle(rowData.level ?? 0)}>
          <Cancel style={{
            marginRight: '10px',
            cursor: 'pointer',
            color: 'rgb(198, 40, 40)',
            fontSize: '14px',
            verticalAlign: 'middle',
          }}
          />
          {rowData[EVENT_NAME_COLUMN]}
        </span>
      )
  );

  const selectRowClassName = (rowData: any) => {
    const level = rowData.level ?? 0;
    if (level <= 0 || level > 5) return '';
    return `indent-level-${level}-tint`;
  };
  
  const tableContent = (
    <>
      {
        openDetails && (
          <ActivityDetails
            onClose={closeDetailsHandler}
            detailInfo={detailInfo}
          />
        )
}
      <Paper elevation={2} sx={{ marginBottom: 10 }}>
        <div>
          <DataTable
            id="activity-table"
            value={localLogs}
            filters={defaultState}
            size="small"
            columnResizeMode="expand"
            resizableColumns
            showGridlines
            reorderableColumns
            removableSort
            header={header}
            scrollable
            scrollHeight="calc(100vh - 300px)"
            paginator
            onRowClick={rowClickHandler}
            selection={selectedRow}
            onRowSelect={onRowSelect}
            // onRowToggle={toggleRow}
            selectionMode="single"
            rows={25}
            rowClassName={selectRowClassName}
            loading={false}
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
              expander={(rowData: DerivedLog) => (rowData.children?.length ?? 0) > 0}
              style={{ width: '3em' }}
              className="activity-row-expander"
            />
            <Column
              key={EVENT_NAME_COLUMN}
              field={EVENT_NAME_COLUMN}
              header="Event"
              hidden={false}
              body={firstColumnTemplate}
              sortable={false}
              resizeable
              style={{ minWidth: '150px', paddingLeft: '16px' }}
              headerClassName="custom-title"
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
                  sortable={false}
                  resizeable
                  style={{ minWidth: '150px', paddingLeft: '16px' }}
                  headerClassName="custom-title"
                />
              )) : null}
          </DataTable>
        </div>
      </Paper>
      <div style={{ height: '10px' }} />
    </>
  );
    
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
