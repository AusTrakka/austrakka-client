import React, { useState } from 'react';
import {
  IconButton,
  MenuItem,
  Menu,
  Checkbox,
  ListItemText,
  Button,
  Stack,
  Tooltip,
  Paper,
} from '@mui/material';
import { ViewColumn } from '@mui/icons-material';

interface ColumnVisibilityMenuProps {
  columns: any[];
  onColumnVisibilityChange: (selectedColumns: any[]) => void;
}

function ColumnVisibilityMenu(props: ColumnVisibilityMenuProps) {
  const { columns, onColumnVisibilityChange } = props;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedColumns, setSelectedColumns] = useState<any>([]);
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

  return (
    <div>
      <Tooltip title="Show/Hide Columns" placement="top" arrow>
        <IconButton
          aria-label="more"
          id="long-button"
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
            minWidth: '230px',
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
            <Stack direction="row" spacing={2}>
              <div>
                <Button
                  variant="contained"
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
                  color="error"
                  sx={{ pointerEvents: 'auto' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onColumnReset();
                  }}
                >
                  Reset
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
              checked={selectedColumns.some(
                (p: any) => p.header === column.header,
              )}
            />
            <ListItemText primary={column.header} />
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
}

export default ColumnVisibilityMenu;
