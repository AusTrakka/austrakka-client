import React, { useState } from 'react';
import { Box, Chip, Tooltip, Drawer, Typography } from '@mui/material';
import CopyChip from '../Common/CopyChip';
import { columnStyleRules } from '../../styles/metadataFieldStyles';

interface AllowedValuesProps {
  field: string,
  allowedValues: string[],
}

export default function AllowedValues(props: AllowedValuesProps) {
  const { allowedValues, field } = props;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const maxVisible = 5;
  const visibleValues = allowedValues.slice(0, maxVisible);
  const remainingCount = allowedValues.length - visibleValues.length;

  const handleMoreClick = () => {
    setDrawerOpen(true);
  };
    
  return (
    <>
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              maxWidth: 500,
              padding: 4,
              borderLeft: 6,
              borderColor: 'secondary.main',
            },
          },
        }}
      >
        <Box role="presentation" onKeyDown={() => setDrawerOpen(false)}>
          <Typography variant="subtitle2" color="textDisabled" gutterBottom>
            Field
          </Typography>
          <Typography variant="h5" color="primary">
            {field}
          </Typography>
          <Typography variant="subtitle2" paddingTop={2} color="textDisabled" gutterBottom>
            Allowed values
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', width: '100%' }} className={columnStyleRules[field]}>
            {allowedValues.map((value) => (
              <CopyChip
                key={value}
                value={value}
              />
            ))}
          </Box>
        </Box>
      </Drawer>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', overflow: 'hidden', width: '100%' }}>
        {visibleValues.map((value) => (
          <Box className={columnStyleRules[field]}>
            <CopyChip key={value} value={value} />
          </Box>
        ))}
        {remainingCount > 0 && (
          <Tooltip title="View all" arrow>
            <Chip
              key="more"
              label={`+${remainingCount} more`}
              onClick={handleMoreClick}
              sx={{ marginRight: '0.1rem', marginTop: '0.1rem' }}
            />
          </Tooltip>
        )}
      </Box>
    </>
  );
}
