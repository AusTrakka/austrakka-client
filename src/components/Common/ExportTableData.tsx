import { Close, SimCardDownload } from '@mui/icons-material';
import { Alert, AlertTitle, Dialog, IconButton, Tooltip } from '@mui/material';
import React, { useRef, useState } from 'react';
import { CSVLink } from 'react-csv';
import LoadingState from '../../constants/loadingState';

import { fieldRenderFunctions, typeRenderFunctions } from '../../utilities/renderUtils';

// Do not recalculate CSV data when filters are reapplied or removed
// This will only be effective so long as the export filename is not changed

interface ExportTableDataProps {
  dataToExport: any[]
  disabled: boolean
  headers?: any[]
}

function ExportTableData(props: ExportTableDataProps) {
  const { dataToExport, disabled, headers } = props;
  const [exportCSVStatus, setExportCSVStatus] = useState<LoadingState>(LoadingState.IDLE);
  const csvLink = useRef<CSVLink & HTMLAnchorElement & { link: HTMLAnchorElement }>(null);

  const formatDataAsCSV = (data: any[], headerString: string[]) => {
    // Format data array as CSV string

    const csvRows = [];

    // Add headers
    csvRows.push(headerString.join(','));

    // Add data rows
    for (const row of data) {
      const values = headerString.map(header => row[header]);
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  };

  const generateFilename = () => {
    const dateObject = new Date();
    const year = dateObject.toLocaleString('default', { year: 'numeric' });
    const month = dateObject.toLocaleString('default', { month: '2-digit' });
    const day = dateObject.toLocaleString('default', { day: '2-digit' });
    return `austrakka_export_${year}${month}${day}`;
  };

  const exportData = () => {
    setExportCSVStatus(LoadingState.LOADING);
    if (dataToExport.length > 0) {
      try {
        // Processing data here
        const formattedData = dataToExport.map((row: any) => {
          const formattedRow: any = {};
          for (const [key, value] of Object.entries(row)) {
            const type = value instanceof Date ? 'date' : (typeof value).toLocaleLowerCase();
            switch (true) {
              case (key in fieldRenderFunctions):
                formattedRow[key] = fieldRenderFunctions[key](value);
                break;
              case (type in typeRenderFunctions):
                formattedRow[key] = typeRenderFunctions[type](value);
                break;
              case typeof value === 'string':
                formattedRow[key] = (value as string).replace(/"/g, '""');
                break;
              default:
                formattedRow[key] = value;
            }
          }

          return formattedRow;
        });

        // Set headers
        const header = headers === undefined ?
          Object.keys(formattedData[0]) :
          headers.map(h => h.key);

        // Set data for CSVLink
        const csvData = formatDataAsCSV(formattedData, header);
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        csvLink.current?.link.setAttribute('href', url);
        csvLink.current?.link.setAttribute('download', generateFilename() || 'austrakka_export.csv');

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

  return (
    <>
      <Dialog onClose={handleDialogClose} open={exportCSVStatus === LoadingState.ERROR}>
        <Alert severity="error" sx={{ padding: 3 }}>
          <IconButton
            aria-label="close"
            onClick={handleDialogClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
          <AlertTitle sx={{ paddingBottom: 1 }}>
            <strong>Your data could not be exported to CSV.</strong>
          </AlertTitle>
          There has been an error exporting your data to CSV.
          <br />
          Please try again later, or contact an AusTrakka admin.
        </Alert>
      </Dialog>
      <CSVLink
        data={[]}
        ref={csvLink}
        filename={generateFilename() || 'austrakka_export.csv'}
        headers={headers}
      />
      <Tooltip title="Export to CSV" placement="top" arrow>
        <span>
          <IconButton
            onClick={() => {
              exportData();
            }}
            disabled={
              disabled ||
              exportCSVStatus === LoadingState.LOADING ||
              dataToExport.length < 1
            }
            color={disabled ? 'secondary' : 'default'}
          >
            <SimCardDownload />
          </IconButton>
        </span>
      </Tooltip>
    </>
  );
}

ExportTableData.defaultProps = {
  headers: undefined,
};
export default ExportTableData;
