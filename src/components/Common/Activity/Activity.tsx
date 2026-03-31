import { Cancel } from '@mui/icons-material';
import { Alert, AlertTitle, Box, Chip, Paper, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { Column } from 'primereact/column';
import type { TreeNode } from 'primereact/treenode';
import {
  TreeTable,
  type TreeTableExpandedKeysType,
  type TreeTableToggleEvent,
} from 'primereact/treetable';
import { Theme } from '../../../assets/themes/theme';
import useActivityLogs from '../../../hooks/useActivityLogs';
import {
  buildPrimeReactColumnDefinitions,
  type PrimeReactColumnDefinition,
} from '../../../utilities/tableUtils';
import CollapseTreeNodes from '../../TableComponents/CollapseTreeNodes';
import sortIcon from '../../TableComponents/SortIcon';
import ActivityDetails from './ActivityDetails';
import ActivityFilters, { type Filters } from './ActivityFilters';
import { EVENT_NAME_COLUMN, supportedColumns } from './ActivityTableFields';
import type { ActivityDetailInfo } from './activityViewModels.interface';
import EmptyContentPane, { ContentIcon } from './EmptyContentPane';
import '../../../styles/TreeTable.css';
import React, { useCallback, useEffect, useState } from 'react';
import {
  aggregateLogsToTree,
  defaultNodeSort,
  processTreeNodes,
  splitLargeChildrenGroups,
} from '../../../utilities/activityTreeUtils';

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
  const [detailInfo, setDetailInfo] = useState<ActivityDetailInfo>(emptyDetailInfo);
  const [filtersOpen, setFiltersOpen] = useState<boolean>(true);
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<TreeTableExpandedKeysType>({});
  const MAX_VISIBLE_CHILDREN = 600;

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

  const [processingData, setProcessingData] = useState<boolean>(true);
  const isTableLoading = React.useMemo(
    () => dataLoading || processingData,
    [dataLoading, processingData],
  );

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

  const onLeafRowClick = (node: TreeNode) => {
    const info: ActivityDetailInfo = {
      Event: node.data[EVENT_NAME_COLUMN],
      'Time stamp': node.data.eventTime,
      'Event initiated by': node.data.submitterDisplayName,
      Resource: node.data.resourceUniqueString,
      'Resource Type': node.data.resourceType,
      Details: node.data.data || null,
    };
    setDetailInfo(info);
    setOpenDetails(true);
  };

  const collapseParents = (nodeKey: string | number | undefined, childrenCount: number) => {
    const currentlyExpandedKeys = { ...expandedKeys };
    const getChildrenCount = (key: string | number | undefined) =>
      nodes.find((n) => n.key === key)?.children?.length || 0;

    // Total currently rendered children count
    let renderedChildren = Object.keys(currentlyExpandedKeys).reduce(
      (sum, key) => sum + getChildrenCount(key),
      0,
    );

    // If expanding this node doesn't exceed limit, keep all currently expanded nodes
    if (renderedChildren + childrenCount <= MAX_VISIBLE_CHILDREN) {
      return currentlyExpandedKeys;
    }

    // Otherwise, we need to collapse some nodes
    const newKeys = { ...currentlyExpandedKeys };
    for (const key of Object.keys(currentlyExpandedKeys)) {
      if (key === nodeKey) continue; // skip node being expanded

      const removed = getChildrenCount(key);
      delete newKeys[key];
      renderedChildren -= removed;

      if (renderedChildren + childrenCount <= MAX_VISIBLE_CHILDREN) break;
    }

    return newKeys;
  };

  const handleTreeRowClick = (event: { originalEvent: React.MouseEvent; node: TreeNode }) => {
    const { node } = event;
    const nodeChildrenCount = node.children?.length || 0;

    // On click open drawer for leaf nodes
    if (!node.children || nodeChildrenCount === 0) {
      onLeafRowClick(node);
    } else {
      // Expand row for parent nodes
      const newExpandedKeys = collapseParents(node.key, nodeChildrenCount);

      if (newExpandedKeys[node.key!]) delete newExpandedKeys[node.key!];
      else newExpandedKeys[node.key!] = true;

      setExpandedKeys(newExpandedKeys);
    }
  };

  const handleToggleClick = (e: TreeTableToggleEvent) => {
    const expandedEvent = e.value;
    // Find which node was toggled
    const newlyOpenedNodeKey = Object.keys(expandedEvent).find(
      (key) => expandedEvent[key] && !expandedKeys[key],
    );

    // If not newly opened, it means this node was already open and needs to be closed
    if (!newlyOpenedNodeKey) {
      setExpandedKeys(expandedEvent);
      return;
    }

    // Otherwise, check if max children limit is exceeded and collapse other nodes if needed
    const toggledNode = nodes.find((n) => n.key === newlyOpenedNodeKey);
    const toggledNodeChildrenCount = toggledNode?.children?.length || 0;
    const newExpandedKeys = collapseParents(newlyOpenedNodeKey, toggledNodeChildrenCount);

    if (newExpandedKeys[newlyOpenedNodeKey!]) delete newExpandedKeys[newlyOpenedNodeKey!];
    else newExpandedKeys[newlyOpenedNodeKey!] = true;

    setExpandedKeys(newExpandedKeys);
  };

  const aggregatedCellTemplate = useCallback(
    (rowNode: any, params: { countKey: string; previewKey: string; valueKey: string }) => {
      const { data, children } = rowNode;
      const { countKey, previewKey, valueKey } = params;

      const isExpanded = Boolean(expandedKeys && rowNode.key && expandedKeys[rowNode.key]);
      const isParent = Boolean(children?.length);

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

  const unaggregatedCellTemplate = useCallback(
    (rowNode: any, col: PrimeReactColumnDefinition) => {
      const { data, children } = rowNode;

      const isExpanded = Boolean(expandedKeys && rowNode.key && expandedKeys[rowNode.key]);
      const isParent = Boolean(children?.length);

      if (isParent && isExpanded) {
        return null;
      }

      // Work around so tableUtils/renderUtils work with TreeTable bodyData
      const bodyData = data;
      return col.body ? col.body(bodyData) : bodyData[col.field];
    },
    [expandedKeys],
  );

  const firstColumnTemplate = useCallback((row: any) => {
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
  }, []);

  const rowClassName = useCallback(
    (rowNode: TreeNode) => {
      const { key, children } = rowNode;
      const classes: Record<string, boolean> = {};
      const isParent = Boolean(children?.length);
      const isExpanded = Boolean(expandedKeys && key && expandedKeys[key]);

      if (isParent && isExpanded) classes['parent-row-event'] = true;
      if (rowNode.data.parentKey && expandedKeys && expandedKeys[rowNode.data.parentKey]) {
        classes['child-row-event'] = true;
      }
      return classes;
    },
    [expandedKeys],
  );

  useEffect(() => {
    setProcessingData(true);
    setNodes([]);
    setExpandedKeys({});
    if (!dataLoading) {
      const aggregatedNodes = aggregateLogsToTree(refinedLogs);
      const processedNodes = processTreeNodes(aggregatedNodes);
      const defaultSortedNodes = defaultNodeSort(processedNodes);
      const splitNodes = defaultSortedNodes.flatMap((node) => splitLargeChildrenGroups(node, 500));
      setNodes(splitNodes);
      setProcessingData(false);
    }
  }, [dataLoading, refinedLogs]);

  const header = (
    <div
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <CollapseTreeNodes expandedKeys={expandedKeys} setExpandedKeys={setExpandedKeys} />
      </div>
    </div>
  );

  const tableContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
      <ActivityDetails
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
          ) : (
            <TreeTable
              className="tree-table-custom"
              header={header}
              rowClassName={rowClassName}
              value={nodes || []}
              expandedKeys={expandedKeys}
              onToggle={(e) => handleToggleClick(e)}
              onRowClick={handleTreeRowClick}
              showGridlines
              removableSort
              sortIcon={sortIcon}
              paginator
              rows={500}
              rowsPerPageOptions={[500, 1000, 1500, 2000]}
              paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink JumpToPageDropDown"
              currentPageReportTemplate=" Viewing: {first} to {last} of {totalRecords}"
              paginatorPosition="bottom"
              paginatorRight
              rowHover
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
                expander
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
                          return unaggregatedCellTemplate(node, col);
                        }}
                        sortable
                      />
                    ))
                : null}
            </TreeTable>
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
