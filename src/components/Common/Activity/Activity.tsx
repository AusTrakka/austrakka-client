import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, AlertTitle, Box, Chip, Paper, Typography } from '@mui/material';
import { Column } from 'primereact/column';
import { Cancel } from '@mui/icons-material';
import dayjs from 'dayjs';
import { TreeTable, TreeTableExpandedKeysType } from 'primereact/treetable';
import { TreeNode } from 'primereact/treenode';
import { ActivityDetailInfo } from './activityViewModels.interface';
import ActivityDetails from './ActivityDetails';
import { DerivedLog } from '../../../types/dtos';
import useActivityLogs from '../../../hooks/useActivityLogs';
import { buildPrimeReactColumnDefinitions, PrimeReactColumnDefinition } from '../../../utilities/tableUtils';
import sortIcon from '../../TableComponents/SortIcon';
import { Theme } from '../../../assets/themes/theme';
import EmptyContentPane, { ContentIcon } from './EmptyContentPane';
import { supportedColumns, EVENT_NAME_COLUMN } from './ActivityTableFields';
import ActivityFilters, { Filters } from './ActivityFilters';
import CollapseTreeNodes from '../../TableComponents/CollapseTreeNodes';
import './TreeTable.css';

function aggregateLogsToTree(logs: DerivedLog[]): TreeNode[] {
  const usedLogIds = new Set<string>();
  const groups = new Map<string, TreeNode>();
  const buildPrimaryKey = (log: DerivedLog) => `${log.clientSessionId}_${log.eventType}`;
  const buildSecondaryKey = (log: DerivedLog) => `${log.callId}_${log.eventType}`;

  const aggregateByKey = (logsToAggregate: DerivedLog[], buildKey: (log: DerivedLog) => string) => {
    for (const log of logsToAggregate) {
      // Skip logs that have already been grouped in a previous round of aggregation
      if (usedLogIds.has(log.globalId)) continue;

      // Determine the group key based on the provided key function
      const groupKey = buildKey(log);

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          key: groupKey,
          label: log.eventType,
          data: {
            // Include necessary fields for parent nodes
            eventType: log.eventType,
            submitterGlobalId: log.submitterGlobalId,
            resourceType: log.resourceType,
            submitterDisplayName: log.submitterDisplayName,
            eventStatus: log.eventStatus,
            eventTime: log.eventTime,
            resourceCount: 0,
            resourcePreview: null,
            resourceTypeCount: 0,
            resourceTypePreview: null,
          },
          children: [],
        });
      }

      const parent = groups.get(groupKey)!;

      parent.children!.push({
        key: log.globalId,
        label: log.resourceUniqueString,
        data: { ...log, parentKey: parent.key },
        leaf: true,
      });

      usedLogIds.add(log.globalId);
    }
  };

  aggregateByKey(logs, buildPrimaryKey);
  aggregateByKey(logs, buildSecondaryKey);

  return Array.from(groups.values());
}

function processTreeNodes(nodes: TreeNode[]): TreeNode[] {
  return nodes.map(node => {
    const children = node.children ?? [];
    const childCount = children.length;

    if (childCount === 1) {
      // Flatten nodes with single child
      return { ...children[0] };
    } if (childCount > 1) {
      const firstChild = children[0].data as DerivedLog;

      // Generate resourceType preview (unique values among children)
      const uniqueResourceTypes = Array.from(
        new Set(
          children.map(
            child => (child.data as DerivedLog).resourceType,
          ),
        ),
      );

      return {
        ...node,
        label: `${node.data.eventType} (${childCount})`,
        data: {
          ...node.data,
          resourceCount: childCount,
          resourcePreview: firstChild.resourceUniqueString,
          resourceTypeCount: uniqueResourceTypes.length,
          resourceTypePreview: uniqueResourceTypes[0],
        },
        // Ensure each child is a new object to avoid shared references
        children: children.map(child => ({ ...child, data: { ...child.data } })),
      };
    }
    // Leaf node
    return {
      ...node,
      children: undefined,
      leaf: true,
    };
  });
}

function splitLargeChildrenGroups(parent: TreeNode, maxSize = 500): TreeNode[] {
  const children = parent.children ?? [];
  if (children.length <= maxSize) return [parent];

  const chunks: TreeNode[] = [];
  for (let i = 0; i < children.length; i += maxSize) {
    const chunkChildren = children.slice(i, i + maxSize);
    chunks.push({
      key: `${parent.key}_${i / maxSize}`,
      label: `${parent.label} (${i + 1}-${i + chunkChildren.length})`,
      data: { ...parent.data, resourceCount: chunkChildren.length },
      children: chunkChildren,
    });
  }
  return chunks;
}

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
  const [columns, setColumns] = useState<PrimeReactColumnDefinition[]>([]);
  const [openDetails, setOpenDetails] = useState(false);
  const [detailInfo, setDetailInfo] = useState<ActivityDetailInfo>(emptyDetailInfo);
  const [filtersOpen, setFiltersOpen] = useState<boolean>(true);
  const [expandedKeys, setExpandedKeys] =
    useState<TreeTableExpandedKeysType | undefined>(undefined);

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
  
  const routeSegment = recordType === 'Tenant'
    ? recordType
    : `${recordType}V2`;

  const {
    refinedLogs,
    httpStatusCode,
    isLoadingErrorMsg,
    dataLoading,
  } = useActivityLogs(
    routeSegment,
    filters,
    rGuid,
  );

  const [loadingState, setLoadingState] = useState<boolean>(dataLoading);
  const isTableLoading = dataLoading || loadingState;

  useEffect(() => {
    if (dataLoading) {
      setLoadingState(true);
    }
  }, [dataLoading]);

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

  const onLeafRowClick = (node: TreeNode) => {
    const info: ActivityDetailInfo = {
      'Event': node.data[EVENT_NAME_COLUMN],
      'Time stamp': node.data.eventTime,
      'Event initiated by': node.data.submitterDisplayName,
      'Resource': node.data.resourceUniqueString,
      'Resource Type': node.data.resourceType,
      'Details': node.data.data || null,
    };
    setDetailInfo(info);
    setOpenDetails(true);
  };

  const handleTreeRowClick = (event: { originalEvent: React.MouseEvent; node: TreeNode }) => {
    const { node } = event;

    // On click open drawer for leaf nodes
    if (!node.children || node.children.length === 0) {
      onLeafRowClick(node);
    } else {
      // Expand row for parent nodes
      const newExpandedKeys = { ...expandedKeys };

      if (newExpandedKeys[node.key!]) delete newExpandedKeys[node.key!];
      else newExpandedKeys[node.key!] = true;

      setExpandedKeys(newExpandedKeys);
    }
  };

  const aggregatedCellTemplate = useCallback(
    (rowNode: any, params: { countKey: string; previewKey: string; valueKey: string }) => {
      const { data, key, children } = rowNode;
      const { countKey, previewKey, valueKey } = params;

      const isExpanded = !!expandedKeys?.[key];
      const isParent = !!children && children.length > 0;

      if (isParent && isExpanded) {
        return null;
      }

      if (data[countKey] && data[countKey] > 1) {
        return (
          <span>
            {data[previewKey]}
            <Chip
              variant="outlined"
              color="primary"
              size="small"
              label={`+${data[countKey] - 1} more`}
              sx={{ marginLeft: '8px' }}
            />
          </span>
        );
      }
      return data[valueKey] || '-';
    },
    [expandedKeys],
  );

  const firstColumnTemplate = useCallback(
    (row: any) => {
      if (row.data.eventStatus === 'Failed') {
        return (
          <span>
            <Cancel
              style={{
                marginRight: '5px',
                cursor: 'pointer',
                color: Theme.SecondaryRed,
                fontSize: '14px',
                verticalAlign: 'middle',
              }}
            />
            {row.data[EVENT_NAME_COLUMN]}
          </span>
        );
      }
      return row.data[EVENT_NAME_COLUMN];
    },
    [],
  );

  const rowClassName = useCallback(
    (rowNode: TreeNode) => {
      const { key, children } = rowNode;
      const classes: Record<string, boolean> = {};
      const isParent = !!children?.length;
      const isExpanded = expandedKeys && key && !!expandedKeys[key];

      if (isParent && isExpanded) classes['parent-row-event'] = true;
      if (rowNode.data.parentKey && expandedKeys && expandedKeys[rowNode.data.parentKey]) {
        classes['child-row-event'] = true;
      }
      return classes;
    },
    [expandedKeys],
  );

  useEffect(() => {
    if (!dataLoading) {
      setLoadingState(false);
    }
  }, [dataLoading]);

  // const nodes = useMemo(() => {
  //   if (dataLoading) return [];
  //   const aggregated = aggregateLogsToTree(refinedLogs);
  //   const processed = processTreeNodes(aggregated);
  //   return processed.flatMap(node => splitLargeChildrenGroups(node, 500));
  // }, [dataLoading, refinedLogs]);

  const aggregatedNodes = useMemo(() => aggregateLogsToTree(refinedLogs), [refinedLogs]);
  const processedNodes = useMemo(() => processTreeNodes(aggregatedNodes), [aggregatedNodes]);
  const nodes = useMemo(
    () =>
      processedNodes.flatMap(node =>
        splitLargeChildrenGroups(node, 500)),
    [processedNodes],
  );

  const header = (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <CollapseTreeNodes
          expandedKeys={expandedKeys}
          setExpandedKeys={setExpandedKeys}
        />
      </div>
    </div>
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
          {isTableLoading ? (
            <Box sx={{ p: 4 }}>
              <EmptyContentPane message="Loading activity logs." icon={ContentIcon.Loading} />
            </Box>
          ) :
            (
              <>
                <TreeTable
                  className="tree-table-custom"
                  header={header}
                  rowClassName={rowClassName}
                  // rowClassName={(rowNode) => {
                  //   const { key, children } = rowNode;
                  //   const classes: Record<string, boolean> = {};
                  //   const isParent = !!children?.length;
                  //   const isExpanded = expandedKeys && key && !!expandedKeys[key];
                  //   if (isParent && isExpanded) classes['parent-row-event'] = true;
                  //   if (rowNode.data.parentKey &&
                  //     expandedKeys &&
                  //     expandedKeys[rowNode.data.parentKey]
                  //   ) {
                  //     classes['child-row-event'] = true;
                  //   }
                  //   return classes;
                  // }}
                  value={nodes || []}
                  expandedKeys={expandedKeys}
                  onToggle={(e) => setExpandedKeys(e.value)}
                  onRowClick={handleTreeRowClick}
                  // scrollHeight="400px"
                  showGridlines
                  removableSort
                  sortIcon={sortIcon}
                  paginator
                  rows={25}
                  rowsPerPageOptions={[25, 50, 100, 500, 2000]}
                  paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink JumpToPageDropDown"
                  currentPageReportTemplate=" Viewing: {first} to {last} of {totalRecords}"
                  paginatorPosition="bottom"
                  paginatorRight
                  rowHover
                  selectionMode="single"
                  emptyMessage={httpStatusCode === 413 ? (
                    <Alert severity="error" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      <AlertTitle>Error</AlertTitle>
                      {isLoadingErrorMsg || 'The activity log is too large to display. Please narrow your filters.'}
                    </Alert>
                  ) : (
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
                    expander
                  />
                  {columns ? columns.filter((col: PrimeReactColumnDefinition) =>
                    col.field !== EVENT_NAME_COLUMN)
                    .map((col: any) => (
                      <Column
                        key={col.field}
                        field={col.field}
                        header={col.header}
                        hidden={false}
                        body={(node: TreeNode) => {
                          if (col.field === 'resourceUniqueString') {
                            return aggregatedCellTemplate(node, {
                              countKey: 'resourceCount',
                              previewKey: 'resourcePreview',
                              valueKey: 'resourceUniqueString',
                            });
                          }
                          if (col.field === 'resourceType') {
                            return aggregatedCellTemplate(node, {
                              countKey: 'resourceTypeCount',
                              previewKey: 'resourceTypePreview',
                              valueKey: 'resourceType',
                            });
                          }
                          // Work around so tableUtils/renderUtils work with TreeTable bodyData
                          const bodyData = node.data;
                          return col.body ? col.body(bodyData) : bodyData[col.field];
                        }}
                        sortable
                      />
                    )) : null}
                </TreeTable>
              </>
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

  return (
    <>
      {contentPane}
    </>
  );
}

export default Activity;
