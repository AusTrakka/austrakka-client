import React, {FC, useEffect, useState} from "react";
import {FilterMatchMode} from "primereact/api";
import {
    DataTable,
    DataTableOperatorFilterMetaData,
    DataTableRowClickEvent,
    DataTableSelectEvent
} from "primereact/datatable";
import {Paper, Typography} from "@mui/material";
import {Column} from "primereact/column";
import {ActivityDetailInfo} from "./activityViewModels.interface";
import ActivityDetails from "./ActivityDetails";
import {Info} from "@mui/icons-material";
import {ActivityField, RefinedLog} from "../../../types/dtos";
import useActivityLogs from "../../../hooks/useActivityLogs";
import {buildPrimeReactColumnDefinitions} from "../../../utilities/tableUtils";
import FriendlyHeader from "../../../types/friendlyHeader.interface";
import TableToolbar from "./TableToolbar";
import ReduxLoadingState from "../../Platform/ReduxLoadingState";

interface ActivityProps {
    recordType: string,
    rguid: string,
    owningTenantGlobalId: string,
}

const emptyDetailInfo: ActivityDetailInfo = {
    "Operation name": "",
    "Time stamp": "",
    "Event initiated by": "",
    resource: "",
    resourceType: "",
    details: {}
}

export const supportedColumns: ActivityField[] = [
    {
        columnName: 'eventShortDescription',
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
    
    const routeSegment = props.recordType === 'tenant' 
        ? props.recordType
        : `${props.recordType}V2`;
    
    const { refinedLogs } = useActivityLogs(routeSegment, props.rguid, props.owningTenantGlobalId);

    useEffect(() => {
        if (columns.length > 0) return;

        const firstCol = supportedColumns.filter(c => c.columnName === 'eventShortDescription')[0];
        const firstColBuilder = buildPrimeReactColumnDefinitions([firstCol])[0];
        firstColBuilder.isDecorated = true;
        firstColBuilder.body = firstColumnTemplate;
        
        const remainingCols = supportedColumns.filter(c => c.columnName !== 'eventShortDescription');
        const remainingColsBuilder = buildPrimeReactColumnDefinitions(remainingCols);
        
        const columnBuilder = [firstColBuilder];
        columnBuilder.push(...remainingColsBuilder);
        setColumns(columnBuilder);
    }, [props.recordType, props.rguid, props.owningTenantGlobalId]);

    const rowClickHandler = (event: DataTableRowClickEvent) => {
        const row = event.data; 
        
        const info: ActivityDetailInfo = {
            "Operation name": row['eventShortDescription'],
            "Time stamp": row['eventTime'],
            "Event initiated by": row['submitterDisplayName'],
            resource: row['resourceUniqueString'],
            resourceType: row['resourceType'],
            details: row['jsonData'] || {},
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
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '15px' }}>
                <Info sx={{color: 'rgb(21,101,192)', fontSize: '16px', marginRight: '10px'}}/>
                {rowData['eventShortDescription']}
            </div>
        );
    };
    
    return(
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
                        dataKey="eventGlobalId"
                        value={refinedLogs}
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
                        rowClassName={(r) => r.eventGlobalId === selectedRow?.eventGlobalId ? 'highlighted-row' : ''}
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
                        {columns ? columns.map((col: any, index: any) => (
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