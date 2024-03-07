import { Close, FileDownload } from '@mui/icons-material';
import { Alert, AlertTitle, CircularProgress, Dialog, IconButton, Tooltip } from '@mui/material';
import React, { memo, useRef } from 'react';
import { CSVLink } from 'react-csv';
import LoadingState from '../../constants/loadingState';

// Do not recalculate CSV data when filters are reapplied or removed
// This will only be effective so long as the export filename is not changed
const MemoisedCSVLink = memo(CSVLink);

interface ExportTableDataProps {
  dataToExport: any
  exportCSVStatus: any
  setExportCSVStatus: any
}

function ExportTableData(props: ExportTableDataProps) {
  const { dataToExport, exportCSVStatus, setExportCSVStatus } = props;
  const csvLink = useRef<CSVLink & HTMLAnchorElement & { link: HTMLAnchorElement }>(null);

  const exportData = () => {
    setExportCSVStatus(LoadingState.LOADING);
    if (dataToExport.length > 0) {
      try {
        csvLink?.current?.link.click();
        setExportCSVStatus(LoadingState.IDLE);
      } catch (error) {
        setExportCSVStatus(LoadingState.ERROR);
      }
    }
  };

  const generateFilename = () => {
    const dateObject = new Date();
    const year = dateObject.toLocaleString('default', { year: 'numeric' });
    const month = dateObject.toLocaleString('default', { month: '2-digit' });
    const day = dateObject.toLocaleString('default', { day: '2-digit' });
    return `austrakka_export_${year}${month}${day}`;
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
      <MemoisedCSVLink
        data={dataToExport}
        ref={csvLink}
        style={{ display: 'none' }}
        filename={generateFilename() || 'austrakka_export.csv'}
      />
      <Tooltip title="Export to CSV" placement="top" arrow>
        <span>
          <IconButton
            onClick={() => {
              exportData();
            }}
            disabled={exportCSVStatus === LoadingState.LOADING || dataToExport.length < 1}
          >
            <FileDownload />
          </IconButton>
        </span>
      </Tooltip>
    </>
  );
}
export default ExportTableData;
