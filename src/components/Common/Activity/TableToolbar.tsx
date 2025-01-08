import React, {FC} from "react";
import CsvExportButton from "../Export/CsvExportButton";
import {RowData} from "../../../types/RowData.interface";
import FriendlyHeader from "../../../types/friendlyHeader.interface";

interface TableToolbarProps {
    loadingState?: string | null,
    filteredData: RowData[],
    rowDataHeaders: FriendlyHeader[],
    showDisplayHeader?: boolean | null,
    showExportButton?: boolean | null
}

const TableToolbar: FC<TableToolbarProps> = (props) => {
    
    return (
        <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%'}}>
            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                { props.showExportButton && 
                    <CsvExportButton
                        headers={props.rowDataHeaders}
                        dataToExport={props.filteredData ?? []}
                        showDisplayHeader={props.showDisplayHeader ?? false}
                        // disabled={props.loadingState !== ReduxLoadingState.DATA_LOADED}
                        // TODO: Drive this with loading state information.
                        disabled={false}
                    />}
            </div>
        </div>
    );
}

export default TableToolbar;