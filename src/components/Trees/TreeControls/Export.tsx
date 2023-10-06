/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import * as React from 'react';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import DownloadIcon from '@mui/icons-material/Download';
import { Menu } from '@mui/material';
import html2canvas from 'html2canvas';
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
  legendRef: React.RefObject<HTMLDivElement>,
}

export default function ExportButton(
  { analysisName, phylocanvasRef, legendRef }: Props,
) {
  const download = (blob: Blob | string, filename: string, encode: boolean) => {
    let blobData: Blob | string;
    if (typeof blob === 'string' && encode) {
      blobData = base64toBlob(blob);
    } else {
      blobData = blob as Blob;
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

  const convertHtmlToPngDataUrl = async (element : HTMLDivElement) => {
    if (!element) {
      return null;
    }

    try {
      // Create a canvas element
      const canvas = document.createElement('canvas');

      // Set canvas dimensions to match the element's size
      canvas.width = element.offsetWidth;
      canvas.height = element.offsetHeight;
      // Log the dimensions of the canvas element.
      // Log the image format that you are converting the canvas content to.
      // Render the element onto the canvas
      try {
        await html2canvas(element, { canvas });
      } catch (error) {
        console.error('Error converting HTML to PNG data URL:', error);
      }

      // Convert the canvas content to a PNG data URL
      const dataURL = canvas.toDataURL('image/png');

      return dataURL;
    } catch (error) {
      return null;
    }
  };

  const handleLegendExport = async () => {
    if (!legendRef.current) {
      return;
    }
    // Log the size of the legend element in pixels.
    try {
      const pngURL = await convertHtmlToPngDataUrl(legendRef.current);
      if (pngURL !== null) {
        download(pngURL, 'legend.png', true);
      } else {
        console.error('legendRef.current is null or undefined.');
      } // Use 'legend.png' as the filename
    } catch (error) {
      console.error('Error exporting legend as PNG:', error);
    }
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
        <MenuItem onClick={() => handleLegendExport()} disabled={!legendRef.current}>
          Export legend
        </MenuItem>
      </Menu>
    </>
  );
}
