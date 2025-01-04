import React, {useRef, useState} from "react";
import LoadingState from "../../../constants/loadingState";
import {CSVLink} from "react-csv";
import {generateFilename} from "../../../utilities/file";
import ExportErrorDialog from "./ExportErrorDialog";
import ExportToolTip from "./ExportToolTip";
import {generateCSV2} from "../../../utilities/exportUtils";
import FriendlyHeader from "../../../types/friendlyHeader.interface";



interface CsvExportButtonProps {
    dataToExport: any[],
    disabled: boolean,
    headers: FriendlyHeader[],
    showDisplayHeader: boolean,
}

function CsvExportButton(props: CsvExportButtonProps) {
    const { dataToExport, disabled, headers, showDisplayHeader } = props;
    const [exportCSVStatus, setExportCSVStatus] = useState<LoadingState>(LoadingState.IDLE);
    const csvLink = useRef<CSVLink & HTMLAnchorElement & { link: HTMLAnchorElement }>(null);

    const exportData = () => {
        setExportCSVStatus(LoadingState.LOADING);
        if (dataToExport.length > 0) {
            try {
                // use a package.
                const csvData = generateCSV2(dataToExport, headers);
                
                const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
                const url = URL.createObjectURL(blob);

                csvLink.current?.link.setAttribute('href', url);
                csvLink.current?.link.setAttribute('download', generateFilename());

                // Trigger click to download
                csvLink.current?.link.click();
                setExportCSVStatus(LoadingState.IDLE);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Error exporting data to CSV:', error);
                setExportCSVStatus(LoadingState.ERROR);
            }
        }
    };

    const handleDialogClose = () => {
        setExportCSVStatus(LoadingState.IDLE);
    };
    
    const selectHeaders = (showDisplayHeader: boolean, headers?: FriendlyHeader[]) => {
        return showDisplayHeader 
            ? headers?.map(header => header.displayName) 
            : headers?.map(header => header.name);
    };

    return (
        <>
            {
                exportCSVStatus === LoadingState.ERROR &&
                <ExportErrorDialog open={true} onClose={handleDialogClose} />
            }
            <CSVLink
                data={[]}
                ref={csvLink}
                filename={generateFilename()}
                headers={selectHeaders(showDisplayHeader, headers)}
            />
            <ExportToolTip
                exportData={exportData}
                disabled={
                    disabled ||
                    exportCSVStatus === LoadingState.LOADING ||
                    dataToExport.length < 1
                }
            />
        </>
    );
}

export default CsvExportButton;