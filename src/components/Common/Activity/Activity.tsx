import React, { useEffect, useState } from 'react';
import { FilterMatchMode } from 'primereact/api';
import {
  DataTable,
  DataTableOperatorFilterMetaData,
  DataTableRowClickEvent,
  DataTableRowToggleEvent,
  DataTableSelectEvent,
} from 'primereact/datatable';
import { Alert, AlertTitle, Button, CircularProgress, Paper, Typography } from '@mui/material';
import { Column } from 'primereact/column';
import { Cancel, Info } from '@mui/icons-material';
import { ActivityDetailInfo } from './activityViewModels.interface';
import ActivityDetails from './ActivityDetails';
import { ActivityField, RefinedLog } from '../../../types/dtos';
import useActivityLogs, { FirstPageRequest } from '../../../hooks/useActivityLogs';
import { buildPrimeReactColumnDefinitions, ColumnBuilder } from '../../../utilities/tableUtils';
import FriendlyHeader from '../../../types/friendlyHeader.interface';
import TableToolbar from './TableToolbar';
import EmptyContentPane, { ContentIcon } from '../EmptyContentPane';

interface ActivityProps {
  recordType: string,
  rGuid: string,
  owningTenantGlobalId: string,
}

const emptyDetailInfo: ActivityDetailInfo = {
  'Operation name': '',
  'Time stamp': '',
  'Event initiated by': '',
  'Resource': '',
  'Resource Type': '',
  'Details': null,
};

const OPERATION_NAME_COLUMN: string = 'operationName';

export const supportedColumns: ActivityField[] = [
  {
    columnName: OPERATION_NAME_COLUMN,
    columnDisplayName: 'Operation name',
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
    primitiveType: 'string',
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

export const defaultState = {
  global: {
    operator: 'and',
    constraints: [{
      value: null,
      matchMode: FilterMatchMode.CONTAINS,
    }],
  } as DataTableOperatorFilterMetaData,
};

function Activity({ recordType, rGuid, owningTenantGlobalId }: ActivityProps): JSX.Element {
  const [columns, setColumns] = useState<any[]>([]);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedRow, setSelectedRow] = useState<RefinedLog | null>(null);
  const [detailInfo, setDetailInfo] = useState<ActivityDetailInfo>(emptyDetailInfo);
  const [localLogs, setLocalLogs] = useState<RefinedLog[]>([]);

  // Default to 7 days of logs
  const firstPageReq: FirstPageRequest = {
    startPeriod: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endPeriod: new Date().toISOString(),
    pageSize: 2,
  };
  
  const routeSegment = recordType === 'tenant'
    ? recordType
    : `${recordType}V2`;
    
  const {
    refinedLogs,
    httpStatusCode,
    dataLoading,
    moreDataLoading,
    loadMore,
    noMoreData,
  } = useActivityLogs(routeSegment, rGuid, owningTenantGlobalId, firstPageReq);

  const transformData = (data: RefinedLog[]): RefinedLog[] => {
    const nodesByKey: { [key: string]: RefinedLog } = {};
    const rootNodes: RefinedLog[] = [];

    const addChildren = (node: RefinedLog, parentLevel: number): void => {
      node.level = parentLevel; // Set the level of the current node
      node.children?.forEach((child) => {
        addChildren(child, parentLevel + 1); // Recursively assign level to children
      });
    };

    data.forEach((item) => {
      if (item.aggregationKey) nodesByKey[item.aggregationKey!] = item;
    });

    data.forEach((item) => {
      if (item.aggregationMemberKey
        /*
        * An aggregate can be a member of a parent aggregate. However, if
        * the root level being displayed does not contain the parent aggregate,
        * then the child aggregate should be displayed at the root level.
        * Eg, tenant (agg) -> org (agg1) -> sample
        * 
        * If displaying platform(tenant) level, org should be displayed as a child 
        * of tenant. However, if displaying at the org level (get activity log for org),
        * org should be displayed at the root level. The server would not return
        * information about the parent. Therefore, this is the check for the parent.
        * */
        && nodesByKey[item.aggregationMemberKey]) {
        const parentNode = nodesByKey[item.aggregationMemberKey];
        if (!parentNode.children) { parentNode.children = []; }
        const existingChildIndex = parentNode.children.findIndex(
          child => child.refinedLogId === item.refinedLogId
        );

        // Merge / append children.
        if (existingChildIndex === -1) {
          // Item doesn't exist, add it
          parentNode.children.push(item);
        } else {
          // Item exists, update it
          parentNode.children[existingChildIndex] = item;
        }
      } else {
        rootNodes.push(item); // Root node has no parent
      }
    });

    rootNodes.forEach((node) => addChildren(node, 0));
    return rootNodes;
  };

  useEffect(() => {
    if (!dataLoading && !moreDataLoading && refinedLogs.length > 0) {
      const transformedData = transformData(refinedLogs);
      setLocalLogs(transformedData);
    }
  }, [refinedLogs]);

  useEffect(() => {
    if (columns.length > 0) return;

    const firstCol = supportedColumns.filter(c => c.columnName === OPERATION_NAME_COLUMN)[0];
    const firstColBuilder = buildPrimeReactColumnDefinitions([firstCol])[0];
    firstColBuilder.isDecorated = true;
    const remainingCols = supportedColumns.filter(c => c.columnName !== OPERATION_NAME_COLUMN);
    const remainingColsBuilder = buildPrimeReactColumnDefinitions(remainingCols);
        
    const columnBuilder = [firstColBuilder];
    columnBuilder.push(...remainingColsBuilder);
    setColumns(columnBuilder);
  }, [recordType, rGuid, owningTenantGlobalId, columns.length]);

  const rowClickHandler = (event: DataTableRowClickEvent) => {
    const row = event.data;
        
    const info: ActivityDetailInfo = {
      'Operation name': row[OPERATION_NAME_COLUMN],
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

  const toggleRow = (e: DataTableRowToggleEvent) => {
    const row = (e.data as any[])[0] as RefinedLog;

    const firstChildIdx = localLogs.findIndex((node) =>
      node.aggregationMemberKey
        && row.aggregationKey
        && node.aggregationMemberKey === row.aggregationKey);

    const clonedRows = [...localLogs];

    if (firstChildIdx === -1) {
      // Add
      const rowIdx = localLogs.indexOf(row);
      // Insert row.children at position rowIdx + 1
      clonedRows.splice(rowIdx + 1, 0, ...row.children ?? []);
    } else {
      // Remove
      // Traverse the tree of row recursively to fine all the descendants.
      // Compile the nodes into a flat array. Using this information, remove
      // each member of the array from currentRows.
      const targets: RefinedLog[] = [];

      const findDescendants = (node: RefinedLog) => {
        targets.push(node);
        node.children?.forEach((child) => findDescendants(child));
      };

      if (row.children) {
        for (let i = 0; i < row.children.length; i++) {
          findDescendants(row.children[i]);
        }
      }

      // Remove the targets from the currentRows
      targets.forEach((target) => {
        const idx = clonedRows.indexOf(target);
        if (idx !== -1) {
          clonedRows.splice(idx, 1);
        }
      });
    }
    setLocalLogs(clonedRows);
  };
    
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
          {rowData[OPERATION_NAME_COLUMN]}
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
          {rowData[OPERATION_NAME_COLUMN]}
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
            paginator={false}
            onRowClick={rowClickHandler}
            selection={selectedRow}
            onRowSelect={onRowSelect}
            onRowToggle={toggleRow}
            selectionMode="single"
            rowClassName={selectRowClassName}
            loading={false}
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
              expander={(rowData: RefinedLog) => (rowData.children?.length ?? 0) > 0}
              style={{ width: '3em' }}
              className="activity-row-expander"
            />
            <Column
              key={OPERATION_NAME_COLUMN}
              field={OPERATION_NAME_COLUMN}
              header="Operation name"
              hidden={false}
              body={firstColumnTemplate}
              sortable={false}
              resizeable
              style={{ minWidth: '150px', paddingLeft: '16px' }}
              headerClassName="custom-title"
            />
            {columns ? columns.filter((col: ColumnBuilder) => col.field !== OPERATION_NAME_COLUMN)
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
          <div style={{ display: 'flex', justifyContent: 'center', padding: '15px 0' }}>
            {
              moreDataLoading
              ? <CircularProgress size="30px" />
              : <Button onClick={loadMore} disabled={dataLoading || noMoreData}>More</Button>
            }
          </div>
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
  } else if (!rGuid || !owningTenantGlobalId) {
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
