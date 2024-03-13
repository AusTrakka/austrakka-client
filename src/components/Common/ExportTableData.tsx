import { Close, FileDownload } from '@mui/icons-material';
import { Alert, AlertTitle, Dialog, IconButton, Tooltip } from '@mui/material';
import React, { memo, useRef, useState } from 'react';
import { CSVLink } from 'react-csv';
import LoadingState from '../../constants/loadingState';

// Do not recalculate CSV data when filters are reapplied or removed
// This will only be effective so long as the export filename is not changed
const MemoisedCSVLink = memo(CSVLink);

interface ExportTableDataProps {
  dataToExport: any
  disabled: boolean
}

function ExportTableData(props: ExportTableDataProps) {
  const { dataToExport, disabled } = props;
  const [exportCSVStatus, setExportCSVStatus] = useState<LoadingState>(LoadingState.IDLE);
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
        data={dataToExport.map((row: any) => {
          const formattedRow: any = {};

          for (const [key, value] of Object.entries(row)) {
            // eslint-disable-next-line no-nested-ternary
            formattedRow[key] = Array.isArray(value)
              ? `"${value.map(item => (typeof item === 'string' ? item.replace(/"/g, '""') : item)).join('", "')}"`
              : typeof value === 'string'
                ? value.replace(/"/g, '""')
                : value;
          }

          return formattedRow;
        })}
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
            disabled={
              disabled ||
              exportCSVStatus === LoadingState.LOADING ||
              dataToExport.length < 1
            }
            color={disabled ? 'secondary' : 'default'}
          >
            <FileDownload />
          </IconButton>
        </span>
      </Tooltip>
    </>
  );
}
export default ExportTableData;
