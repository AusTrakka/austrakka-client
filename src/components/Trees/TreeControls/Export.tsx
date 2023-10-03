import * as React from 'react';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import DownloadIcon from '@mui/icons-material/Download';
import { Menu } from '@mui/material';
import { TreeExportFuctions } from '../Tree';

interface Option {
  exportFunction: CallableFunction
  label: string
  fileName: string
  encode: boolean
}

const base64toBlob = (base64Image: string) => {
  // Remove the data URL prefix
  const base64Data = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

  // Decode base64 string
  const decodedImage = atob(base64Data);

  // Create a Uint8Array from the decoded image data
  const byteArray = new Uint8Array(decodedImage.length);
  for (let i = 0; i < decodedImage.length; i += 1) {
    byteArray[i] = decodedImage.charCodeAt(i);
  }

  // Create a Blob from the byte array
  const blob = new Blob([byteArray], { type: 'image/png' });
  return blob;
};

interface Props {
  analysisName: string,
  phylocanvasRef: React.RefObject<TreeExportFuctions>,
  legendRef: any,
}

export default function ExportButton(
  { analysisName, phylocanvasRef, legendRef }: Props,
) {
  const download = (blob: Blob | string, filename: string, encode: boolean) => {
    let blobData: Blob | string;
    if (typeof blob === 'string' && encode) {
      blobData = base64toBlob(blob);
    } else {
      blobData = blob;
    }

    const url = window.URL.createObjectURL(
      new Blob([blobData]),
    );
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      filename,
    );

    // Append to html link element page
    document.body.appendChild(link);

    // Start download
    link.click();

    // Clean up and remove the link
    link.parentNode?.removeChild(link);
  };

  const handleTipExport = () => {
    if (!phylocanvasRef.current) return;
    let leafIDs = phylocanvasRef.current?.getSelectedLeafIDs();
    if (leafIDs.length === 0) {
      leafIDs = phylocanvasRef.current?.getVisibleLeafIDs();
    }
    if (!leafIDs) return;
    const leafIDsString = leafIDs.join('\n');
    download(leafIDsString, `${analysisName}.txt`, false);
  };

  const handleLegendExport = () => {
    console.log('Handle');
  };

  const options: Option[] = [
    {
      exportFunction: () => phylocanvasRef.current?.exportSVG(),
      label: 'Export tree as SVG',
      fileName: `${analysisName}.svg`,
      encode: false,
    },
    {
      exportFunction: () => phylocanvasRef.current?.exportPNG(),
      label: 'Export tree as PNG',
      fileName: `${analysisName}.png`,
      encode: true,
    },
  ];

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        startIcon={<DownloadIcon />}
        variant="contained"
        size="small"
        sx={{ marginTop: 1 }}
      >
        Export
      </Button>
      <Menu
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        onClick={handleClose}
      >
        {options.map((option) => (
          <MenuItem
            key={option.label}
            onClick={() => download(option.exportFunction(), option.fileName, option.encode)}
          >
            {option.label}
          </MenuItem>
        ))}
        <MenuItem onClick={() => handleTipExport()}>
          Export leaves
        </MenuItem>
        <MenuItem onClick={() => handleLegendExport()}>
          Export legend
        </MenuItem>
      </Menu>
    </>
  );
}
