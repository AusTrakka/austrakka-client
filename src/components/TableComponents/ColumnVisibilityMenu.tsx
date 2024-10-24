import React, { useState } from 'react';
import {
  IconButton,
  MenuItem,
  Menu,
  Checkbox,
  Button,
  Stack,
  Tooltip,
  Paper,
  Box,
  Typography,
} from '@mui/material';
import { ViewColumn } from '@mui/icons-material';

interface ColumnVisibilityMenuProps {
  columns: any[];
  onColumnVisibilityChange: (selectedColumns: any[]) => void;
}

function ColumnVisibilityMenu(props: ColumnVisibilityMenuProps) {
  const { columns, onColumnVisibilityChange } = props;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedColumns, setSelectedColumns] = useState<any>(columns.filter((c) => c.hidden));
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleColumnSelect = (column: any) => {
    setSelectedColumns((prevSelectedColumns: any) =>
      (prevSelectedColumns.some((p: any) => p.header === column.header)
        ? prevSelectedColumns.filter((c: any) => c.header !== column.header)
        : [...prevSelectedColumns, column]));
  };

  const onColumnToggle = () => {
    onColumnVisibilityChange(selectedColumns);
    handleClose();
  };

  const onColumnReset = () => {
    setSelectedColumns([]);
    onColumnVisibilityChange([]);
  };

  const onColumnHideAll = () => {
    setSelectedColumns(columns);
    onColumnVisibilityChange(columns);
  };

  return (
    <Box style={{ display: 'flex', alignItems: 'center' }}>
      <Tooltip title="Show/Hide Columns" placement="top" arrow>
        <IconButton
          size="small"
          aria-label="more"
          aria-controls={open ? 'long-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-haspopup="true"
          onClick={handleClick}
        >
          <ViewColumn />
        </IconButton>
      </Tooltip>
      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        keepMounted
        elevation={1}
        open={open}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        sx={{ height: '50vh' }}
        onClose={handleClose}
        MenuListProps={{
          style: {
            padding: 0,
            minWidth: '330px',
          },
        }}
      >
        <Paper
          square
          sx={{
            position: 'sticky',
            backgroundColor: 'white',
            top: 0,
            padding: '5px',
            zIndex: 2,
            display: 'flex',
            justifyContent: 'space-evenly',
          }}
        >
          <MenuItem
            disableGutters
            disableRipple
            dense
            sx={{
              'pointerEvents': 'none',
              '&:hover': { backgroundColor: 'white' },
            }}
          >
            <Stack direction="row" spacing={1} justifyContent="space-evenly">
              <div>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onColumnToggle();
                  }}
                  sx={{ pointerEvents: 'auto' }}
                >
                  Submit
                </Button>
              </div>
              <div>
                <Button
                  variant="outlined"
                  color="inherit"
                  sx={{ pointerEvents: 'auto' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onColumnHideAll();
                  }}
                >
                  Hide All
                </Button>
              </div>
              <div style={{ marginRight: 10 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  sx={{ pointerEvents: 'auto' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onColumnReset();
                  }}
                >
                  Show All
                </Button>
              </div>
            </Stack>
          </MenuItem>
        </Paper>
        {columns.map((column: any) => (
          <MenuItem
            key={column.header}
            value={column.field}
            onClick={() => handleColumnSelect(column)}
          >
            <Checkbox
              checked={!selectedColumns.some(
                (p: any) => p.header === column.header,
              )}
            />
            <Typography>{column.header}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}

export default ColumnVisibilityMenu;
