import React, { useState } from 'react';
import { IconButton, Menu, MenuItem, Dialog, Alert, AlertTitle } from '@mui/material';
import { MoreVert } from '@mui/icons-material';

export default function ExportVegaPlot(props: any) {
  const { vegaView } = props;
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const [exportError, setExportError] = useState(false);
  const [exportErrorMsg, setExportErrorMsg] = useState('');

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchor(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchor(null);
  };
  const handleDialogClose = () => {
    setExportError(false);
  };
  const exportClickHandler = (format: string) => {
    handleMenuClose();
    // Calc date time string to append to exported file name
    const dateObject = new Date();
    const year = dateObject.toLocaleString('default', { year: 'numeric' });
    const month = dateObject.toLocaleString('default', { month: '2-digit' });
    const day = dateObject.toLocaleString('default', { day: '2-digit' });
    const h = dateObject.getHours();
    const m = dateObject.getMinutes();
    const s = dateObject.getSeconds();
    const datetime = `${year}${month}${day}_${h}${m}${s}`;

    if (vegaView) {
      vegaView.toImageURL(format).then((url: string) => {
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('target', '_blank');
        link.setAttribute('download', `austrakka_plot_export_${datetime}.${format}`);
        link.dispatchEvent(new MouseEvent('click'));
      }).catch((error: any) => {
        setExportError(true);
        setExportErrorMsg(error);
      });
    }
  };

  return (
    <>
      <IconButton onClick={handleMenu}>
        <MoreVert />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => exportClickHandler('png')}>
          Export to PNG
        </MenuItem>
        <MenuItem onClick={() => exportClickHandler('svg')}>
          Export to SVG
        </MenuItem>
      </Menu>
      <Dialog open={exportError} onClose={handleDialogClose}>
        <Alert severity="error">
          <AlertTitle>Error exporting plot</AlertTitle>
          {exportErrorMsg}
        </Alert>
      </Dialog>
    </>
  );
}
