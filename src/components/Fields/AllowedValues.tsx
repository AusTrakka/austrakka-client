import React, { useState } from 'react';
import { Box, Chip, Tooltip, Typography } from '@mui/material';
import CopyChip from '../Common/CopyChip';
import { columnStyleRules } from '../../styles/metadataFieldStyles';
import CustomDrawer from '../Common/CustomDrawer';

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
      <CustomDrawer
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
      >
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
      </CustomDrawer>
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
