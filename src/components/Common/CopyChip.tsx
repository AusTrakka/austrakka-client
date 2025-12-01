import React, { useState } from 'react';
import { Box, Chip, Tooltip } from '@mui/material';

export default function CopyChip({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 800);
    });
  };

  return (
    <Box sx={{ display: 'inline-block', position: 'relative' }}>
      <Tooltip title={copied ? 'Copied to clipboard!' : ''} arrow>
        <Chip
          color={copied ? 'success' : 'default'}
          label={value}
          clickable
          onClick={handleCopy}
          variant="outlined"
          sx={{ marginRight: '0.1rem', marginTop: '0.1rem' }}
        />
      </Tooltip>
    </Box>
  );
}
