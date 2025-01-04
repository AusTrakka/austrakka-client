import React, {FC, useEffect, useState} from "react";
import {FilterMatchMode} from "primereact/api";
import {DataTable, DataTableOperatorFilterMetaData, DataTableRowClickEvent} from "primereact/datatable";
import sortIcon from "../TableComponents/SortIcon";
import {Paper, Typography} from "@mui/material";
import {Column} from "primereact/column";
import TableToolbar from "./TableToolbar";
import ReduxLoadingState from "./ReduxLoadingState";
import useActivityLogs from "../../hooks/useActivityLogs";
import {buildPrimeReactColumnDefinitions} from "../../utilities/tableUtils";
import {ActivityField} from "../../types/dtos";
import FriendlyHeader from "../../types/friendlyHeader.interface";

interface AcivityProps {
    recordType: string,
    rguid: string,
    owningTenantGlobalId: string,
}

const supportedColumns: ActivityField[] = [
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

const Activity: FC<AcivityProps> = (props) => {
    const [columns, setColumns] = useState<any[]>([]);

    const { refinedLogs } = useActivityLogs(props.recordType, props.rguid, props.owningTenantGlobalId);

    useEffect(() => {
        if (columns.length > 0) return;
        const columnBuilder = buildPrimeReactColumnDefinitions(supportedColumns);
        // TODO: set loading state.
        setColumns(columnBuilder);
    }, [props.recordType, props.rguid, props.owningTenantGlobalId]);

    const rowClickHandler = (row: DataTableRowClickEvent) => {
        throw new Error("Function not implemented.");
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
            // TODO: change this hard coding
            showExportButton={true}
        ></TableToolbar>
    );
    
    return(
        <>
            <Paper elevation={2} sx={{ marginBottom: 10 }}>
                <div>
                    <DataTable
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
                        sortIcon={sortIcon}
                        paginator
                        onRowClick={rowClickHandler}
                        selectionMode="single"
                        rows={25}
                        // TODO: change this hard coding
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
                                sortable
                                resizeable
                                style={{ minWidth: '150px' }}
                                headerClassName="custom-title"
                            />
                        )) : null}
                    </DataTable>
                </div>
            </Paper>
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