import * as React from 'react';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grow from '@mui/material/Grow';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import DownloadIcon from '@mui/icons-material/Download';
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
}

export default function ExportButton(
  { analysisName, phylocanvasRef }: Props,
) {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const options: Option[] = [
    {
      exportFunction: () => phylocanvasRef.current?.exportSVG(),
      label: 'Export SVG',
      fileName: `${analysisName}.svg`,
      encode: false,
    },
    {
      exportFunction: () => phylocanvasRef.current?.exportPNG(),
      label: 'Export PNG',
      fileName: `${analysisName}.png`,
      encode: true,
    },
  ];

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

  const handleClick = () => {
    const option = options[selectedIndex];
    download(option.exportFunction(), option.fileName, option.encode);
  };

  const handleMenuItemClick = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number,
  ) => {
    setSelectedIndex(index);
    setOpen(false);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpen(false);
  };

  return (
    <>
      <ButtonGroup sx={{ marginY: 1, marginRight: 1 }} variant="contained" ref={anchorRef} aria-label="split button">
        <Button fullWidth onClick={handleClick}>
          {options[selectedIndex].label}
          {/* <DownloadIcon sx={{marginLeft: 1}} /> */}
        </Button>
        <Button
          size="small"
          aria-controls={open ? 'split-button-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-label="select merge strategy"
          aria-haspopup="menu"
          onClick={handleToggle}
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        sx={{
          zIndex: 1,
        }}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === 'bottom' ? 'center top' : 'center bottom',
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu" autoFocusItem>
                  {options.map((option, index) => (
                    <MenuItem
                      key={option.label}
                      selected={index === selectedIndex}
                      onClick={(event) => handleMenuItemClick(event, index)}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
      <Button
        variant="contained"
        color="success"
        onClick={handleTipExport}
        endIcon={<DownloadIcon />}
      >
        Export Leaves
      </Button>
    </>
  );
}
