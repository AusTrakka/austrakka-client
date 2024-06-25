import React, { useState, useMemo } from 'react';
import { IconButton, Popover, List, ListItem, Typography, Box, TextField, Tooltip } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface KeyValueInfoPopoverProps<T> {
  data: T[];
  keyExtractor: (item: T) => string;
  valueExtractor: (item: T) => string;
  valueFormatter?: (value: string) => string;
  searchPlaceholder?: string;
  toolTipTitle?: string;
}

const defaultProps = {
  valueFormatter: (value: string) => value,
  searchPlaceholder: 'Search by key...',
  toolTipTitle: 'Show Info',
};

function KeyValueInfoPopover<T>({
  data,
  keyExtractor,
  valueExtractor,
  valueFormatter = defaultProps.valueFormatter,
  searchPlaceholder = defaultProps.searchPlaceholder,
  toolTipTitle = defaultProps.toolTipTitle,
}: KeyValueInfoPopoverProps<T>) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSearchQuery('');
  };

  const open = Boolean(anchorEl);

  const filteredData = useMemo(() => {
    const searchQueryLower = searchQuery.toLowerCase();
    return data.filter(item => {
      const keyLower = keyExtractor(item).toLowerCase();
      const valueLower = valueExtractor(item).toLowerCase();

      return keyLower.includes(searchQueryLower) || valueLower.includes(searchQueryLower);
    });
  }, [data, searchQuery, keyExtractor, valueExtractor]);

  return (
    <>
      <IconButton onClick={handleClick} aria-label="information">
        <Tooltip title={toolTipTitle} placement="top" arrow>
          <HelpOutlineIcon />
        </Tooltip>
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'center',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '300px',
          }}
        >
          <Box sx={{ p: 1, borderBottom: '1px solid lightgray' }}>
            <TextField
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
            />
          </Box>
          <List
            sx={{
              'overflow': 'scroll',
              'flex': 1,
              'padding': 0,
              '& .MuiListItem-root': {
                borderBottom: '1px solid lightgray',
                py: 0.5,
                px: 2,
                mb: 0,
                justifyContent: 'space-between',
              },
            }}
          >
            {filteredData.map((item) => (
              <ListItem key={keyExtractor(item)}>
                <Typography sx={{ fontWeight: 'bold', mr: 2 }}>
                  {keyExtractor(item)}
                  :
                </Typography>
                <Typography>
                  {valueFormatter(valueExtractor(item))}
                </Typography>
              </ListItem>
            ))}
          </List>
        </Box>
      </Popover>
    </>
  );
}

KeyValueInfoPopover.defaultProps = defaultProps;

export default KeyValueInfoPopover;
