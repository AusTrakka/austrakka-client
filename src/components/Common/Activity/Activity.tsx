import React, {FC, useEffect, useState} from "react";
import {FilterMatchMode} from "primereact/api";
import {
    DataTable,
    DataTableOperatorFilterMetaData,
    DataTableRowClickEvent, 
    DataTableRowToggleEvent,
    DataTableSelectEvent
} from "primereact/datatable";
import {Paper, Typography} from "@mui/material";
import {Column} from "primereact/column";
import {ActivityDetailInfo} from "./activityViewModels.interface";
import ActivityDetails from "./ActivityDetails";
import {Cancel, Info} from "@mui/icons-material";
import {ActivityField, RefinedLog} from "../../../types/dtos";
import useActivityLogs from "../../../hooks/useActivityLogs";
import {buildPrimeReactColumnDefinitions, ColumnBuilder} from "../../../utilities/tableUtils";
import FriendlyHeader from "../../../types/friendlyHeader.interface";
import TableToolbar from "./TableToolbar";
import ReduxLoadingState from "../../Platform/ReduxLoadingState";
import EmptyContentPane, {ContentIcon} from "../EmptyContentPane";

interface ActivityProps {
    recordType: string,
    rguid: string,
    owningTenantGlobalId: string,
}

const emptyDetailInfo: ActivityDetailInfo = {
    "Operation name": "",
    "Time stamp": "",
    "Event initiated by": "",
    Resource: "",
    "Resource Type": "",
    Details: null
}

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
]

const Activity: FC<ActivityProps> = (props) => {
    const [columns, setColumns] = useState<any[]>([]);
    const [openDetails, setOpenDetails] = useState(false);
    const [selectedRow, setSelectedRow] = useState<RefinedLog | null>(null);
    const [detailInfo, setDetailInfo] = useState<ActivityDetailInfo>(emptyDetailInfo);
    const [localLogs, setLocalLogs] = useState<RefinedLog[]>([]);
    
    const routeSegment = props.recordType === 'tenant' 
        ? props.recordType
        : `${props.recordType}V2`;
    
    const { 
        refinedLogs,
        httpStatusCode } = useActivityLogs(routeSegment, props.rguid, props.owningTenantGlobalId);

    useEffect(() => {
        if (refinedLogs.length > 0) {
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
    }, [props.recordType, props.rguid, props.owningTenantGlobalId]);

    const rowClickHandler = (event: DataTableRowClickEvent) => {
        const row = event.data; 
        
        const info: ActivityDetailInfo = {
            "Operation name": row[OPERATION_NAME_COLUMN],
            "Time stamp": row['eventTime'],
            "Event initiated by": row['submitterDisplayName'],
            Resource: row['resourceUniqueString'],
            "Resource Type": row['resourceType'],
            Details: row['displayJsonData'] || null,
        }
        setDetailInfo(info);
        setOpenDetails(true);
    };
    
    const closeDetailsHandler = () => {
        setOpenDetails(false);
        setSelectedRow(null);
    }

    const onRowSelect = (e: DataTableSelectEvent) => {
        setSelectedRow(e.data);
    };

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
                && nodesByKey[item.aggregationMemberKey]) 
            {
                const parentNode = nodesByKey[item.aggregationMemberKey];
                if (parentNode) {
                    if (!parentNode.children) parentNode.children = [];
                    parentNode.children?.push(item); // Add child to parent node
                }
            } else {
                rootNodes.push(item); // Root node has no parent
            }
        });

        rootNodes.forEach((node) => addChildren(node, 0));
        return rootNodes;
    };

    const toggleRow = (e: DataTableRowToggleEvent) => {
        const row = (e.data as any[])[0] as RefinedLog;

        const firstChildIdx = localLogs.findIndex((node) =>
            node.aggregationMemberKey
            && row.aggregationKey
            && node.aggregationMemberKey === row.aggregationKey);

        const clonedRows = [...localLogs];

        if(firstChildIdx === -1) {
            // Add
            const rowIdx = localLogs.indexOf(row);
            // Insert row.children at position rowIdx + 1
            clonedRows.splice(rowIdx + 1, 0, ...row.children ?? []);
        }
        else {
            // Remove
            // Traverse the tree of row recursively to fine all the descendants.
            // Compile the nodes into a flat array. Using this information, remove
            // each member of the array from currentRows.
            const targets: RefinedLog[] = [];

            const findDescendants = (node: RefinedLog) => {
                targets.push(node);
                node.children?.forEach((child) => findDescendants(child));
            };

            if(row.children){
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
    }
    
    const friendlyHeaders: FriendlyHeader[] = supportedColumns
        .sort((a, b) => a.columnOrder - b.columnOrder)
        .map((col) => ({name: col.columnName, displayName: col.columnDisplayName || col.columnName}));
    
    const header = (
        <TableToolbar 
            loadingState={ReduxLoadingState.IDLE}
            filteredData={refinedLogs}
            rowDataHeaders={friendlyHeaders}
            showDisplayHeader={true}
            showExportButton={refinedLogs.length > 0}
        ></TableToolbar>
    );

    const firstColumnTemplate = (rowData: any) => {
        return (
            rowData['eventStatus'] === 'Success'
            ? <span style={getIndentStyle(rowData.level ?? 0)}>
                <Info style={{
                    marginRight: '10px',
                    cursor: 'pointer',
                    color: 'rgb(21,101,192)',
                    fontSize: '14px',
                    verticalAlign: 'middle'
                    }}/>
                {rowData[OPERATION_NAME_COLUMN]}</span>
                
            : <span style={getIndentStyle(rowData.level ?? 0)}>
                <Cancel style={{
                    marginRight: '10px',
                    cursor: 'pointer',
                    color: 'rgb(198, 40, 40)',
                    fontSize: '14px',
                    verticalAlign: 'middle'
                }}/>
                {rowData[OPERATION_NAME_COLUMN]}</span>
        );
    };

    const getIndentStyle = (level: number) => {
        return {
            paddingLeft: `${level * 25}px`,  // Indent by 20px per level
            display: 'inline-flex',  // Use inline-flex to align both the icon and the ID in a row
            alignItems: 'center',
        };
    };
    
    const tableContent = (
        <>
            {
                openDetails &&
                <ActivityDetails
                    onClose={closeDetailsHandler}
                    detailInfo={detailInfo}
                />
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
                        onRowToggle={toggleRow}
                        selectionMode="single"
                        rows={25}
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
                            expander={(rowData: RefinedLog) => (rowData.children?.length ?? 0) > 0}
                            style={{ width: '3em' }}
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
                            .map((col: any, index: any) => (
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
            <div style={{height: '10px'}} />
        </>
    );
    

    
    let contentPane = <></>
    if(httpStatusCode === 401 || httpStatusCode === 403)
    {
        contentPane = <EmptyContentPane 
            message="You do not have permission to view activity logs." 
            icon={ContentIcon.Forbidden} />
    }
    else if(!props.rguid || !props.owningTenantGlobalId)
    {
        contentPane = <EmptyContentPane
            message="Cannot fetch activity log."
            subText="Missing record information."
            icon={ContentIcon.Error} />
    }
    else
    {
        contentPane = refinedLogs.length > 0 
            ? tableContent 
            : <EmptyContentPane message="There is no activity to show." icon={ContentIcon.Inbox} />
    }
    
    return(
        <>
            {contentPane}
        </>
    );
}

export const defaultState = {
    global: {
        operator: 'and',
        constraints: [{
            value: null,
            matchMode: FilterMatchMode.CONTAINS,
        }],
    } as DataTableOperatorFilterMetaData,
};

export default Activity;