import React, { memo, MutableRefObject, useEffect, useState } from 'react';
import { IconButton, Menu, MenuItem, Dialog, Alert, AlertTitle } from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import { View } from 'vega';
import { generateFilename } from '../../utilities/file';

function ExportVegaPlot(props: any) {
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

    if (vegaView) {
      vegaView.toImageURL(format).then((url: string) => {
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('target', '_blank');
        link.setAttribute('download', generateFilename());
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

export default memo(ExportVegaPlot);
