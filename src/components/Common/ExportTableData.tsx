import { Close, SimCardDownload } from '@mui/icons-material';
import { Alert, AlertTitle, Dialog, IconButton, Tooltip } from '@mui/material';
import { useRef, useState } from 'react';
import { CSVLink } from 'react-csv';
import streamSaver from 'streamsaver';
import LoadingState from '../../constants/loadingState';
import { generateCSVStream } from '../../utilities/exportUtils';
import { generateFilename } from '../../utilities/file';

// Do not recalculate CSV data when filters are reapplied or removed
// This will only be effective so long as the export filename is not changed
interface ExportTableDataProps {
  dataToExport: any[];
  disabled: boolean;
  fileNamePrefix: string;
  headers?: string[];
}

function ExportTableData(props: ExportTableDataProps) {
  const { dataToExport, disabled, fileNamePrefix, headers } = props;
  const [exportCSVStatus, setExportCSVStatus] = useState<LoadingState>(LoadingState.IDLE);
  const csvLink = useRef<CSVLink & HTMLAnchorElement & { link: HTMLAnchorElement }>(null);

  const exportData = async () => {
    setExportCSVStatus(LoadingState.LOADING);

    if (dataToExport.length === 0) {
      setExportCSVStatus(LoadingState.IDLE);
      return;
    }

    try {
      const fileName = generateFilename(fileNamePrefix);
      const fileStream = streamSaver.createWriteStream(`${fileName}.csv`);

      // Get your readable stream
      const readable = generateCSVStream(dataToExport, headers); // ReadableStream<Uint8Array>

      // Pipe the data to the file stream
      await readable.pipeTo(fileStream);

      setExportCSVStatus(LoadingState.IDLE);
    } catch (error) {
      setExportCSVStatus(LoadingState.ERROR);
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
          Please try again later, or contact the {import.meta.env.VITE_BRANDING_NAME} team.
        </Alert>
      </Dialog>
      <CSVLink data={[]} ref={csvLink} filename={generateFilename()} headers={headers} />
      <Tooltip title="Export to CSV" placement="top" arrow>
        <span>
          <IconButton
            onClick={() => {
              exportData();
            }}
            disabled={
              disabled || exportCSVStatus === LoadingState.LOADING || dataToExport.length < 1
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
