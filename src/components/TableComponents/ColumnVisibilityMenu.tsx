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
import {
  ViewColumn,
  VisibilityOff,
  Visibility,
  InfoOutlined,
  VisibilityOffOutlined,
} from '@mui/icons-material';

interface ColumnVisibilityMenuProps {
  columns: any[];
  emptyColumnNames?: string[] | null;
  onColumnVisibilityChange: (selectedColumns: any[]) => void;
}

function ColumnVisibilityMenu(props: ColumnVisibilityMenuProps) {
  const { columns, onColumnVisibilityChange, emptyColumnNames } = props;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedColumns, setSelectedColumns] = useState<any>(
    columns.filter((c) => c.hidden),
  );
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleColumnSelect = (column: any) => {
    setSelectedColumns((prevSelectedColumns: any) => {
      const updatedSelection = prevSelectedColumns.some((p: any) => p.header === column.header)
        ? prevSelectedColumns.filter((c: any) => c.header !== column.header)
        : [...prevSelectedColumns, column];

      onColumnVisibilityChange(updatedSelection);
      return updatedSelection;
    });
  };

  const hasHiddenColumns = columns.some((col: any) => col.hidden);

  const onColumnHideAll = () => {
    setSelectedColumns(columns);
    onColumnVisibilityChange(columns);
  };

  const onColumnHideEmpty = () => {
    const columnsToToggle = columns.filter((c) =>
      emptyColumnNames?.includes(c.field));
    setSelectedColumns(columnsToToggle);
    onColumnVisibilityChange(columnsToToggle);
  };

  const onColumnReset = () => {
    setSelectedColumns([]);
    onColumnVisibilityChange([]);
  };

  return (
    <Box style={{ display: 'flex', alignItems: 'center' }}>
      <Tooltip
        title={hasHiddenColumns ? 'Some columns are hidden' : 'Show/Hide Columns'}
        placement="top"
        arrow
      >
        <IconButton
          size="small"
          color={hasHiddenColumns ? 'warning' : 'default'}
          aria-label="column-visibility"
          aria-controls={open ? 'column-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-haspopup="true"
          onClick={handleClick}
        >
          <ViewColumn />
        </IconButton>
      </Tooltip>

      <Menu
        id="column-menu"
        anchorEl={anchorEl}
        keepMounted
        elevation={1}
        open={open}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        onClose={handleClose}
        MenuListProps={{
          disablePadding: true,
          sx: {
            minWidth: 330,
            padding: 0,
          },
        }}
      >
        <Box>
          {/* Fixed header */}
          <Paper
            square
            sx={{
              backgroundColor: 'white',
              padding: 2,
              zIndex: 2,
              borderBottom: '1px solid #ddd',
            }}
          >
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                <Typography variant="subtitle2" fontWeight="bold">
                  Manage column visibility
                </Typography>
                <Tooltip title="Use these options to show or hide columns." placement="top-start" arrow>
                  <InfoOutlined fontSize="small" color="action" />
                </Tooltip>
              </Stack>
              <Stack direction="row" spacing={1} justifyContent="space-evenly" flexWrap="nowrap">
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onColumnHideAll();
                  }}
                  fullWidth
                  startIcon={<VisibilityOff />}
                >
                  Hide All
                </Button>
                {emptyColumnNames && emptyColumnNames.length > 0 && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onColumnHideEmpty();
                    }}
                    fullWidth
                    startIcon={<VisibilityOffOutlined />}
                  >
                    Hide Empty
                  </Button>
                )}
              </Stack>
              <Stack direction="row" justifyContent="center">
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  color="success"
                  onClick={(e) => {
                    e.stopPropagation();
                    onColumnReset();
                  }}
                  startIcon={<Visibility />}
                  disabled={selectedColumns.length === 0}
                >
                  Show All
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {/* Scrollable section */}
          <Box
            sx={{
              maxHeight: 300,
              overflowY: 'auto',
            }}
          >
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
          </Box>
        </Box>
      </Menu>
    </Box>
  );
}

ColumnVisibilityMenu.defaultProps = {
  emptyColumnNames: null,
};

export default ColumnVisibilityMenu;
