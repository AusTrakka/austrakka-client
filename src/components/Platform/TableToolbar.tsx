import React, {Dispatch, FC, SetStateAction} from "react";
import ExportTableData from "../Common/ExportTableData";
import {RowData} from "../../types/RowData.interface";
import ReduxLoadingState from "./ReduxLoadingState";

interface TableToolbarProps {
    loadingState?: string | null,
    columns: any[],
    setColumns: Dispatch<SetStateAction<any[]>>,
    filteredData: RowData[],
    showExportButton?: boolean | null
}

const TableToolbar: FC<TableToolbarProps> = (props) => {
    
    return (
        <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%'}}>
            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                { props.showExportButton && 
                    <ExportTableData
                        dataToExport={
                            props.loadingState === ReduxLoadingState.PARTIAL_LOAD_ERROR
                                ? []
                                : props.filteredData ?? []
                        }
                        // disabled={props.loadingState !== ReduxLoadingState.DATA_LOADED}
                        // TODO: Drive this with loading state information.
                        disabled={false}
                    />}
            </div>
        </div>
    );
}

export default TableToolbar;