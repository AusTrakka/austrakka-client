import { InfoOutlined } from '@mui/icons-material';
import { Box, IconButton, Popover, Typography } from '@mui/material';
import { useState } from 'react';

interface FieldHelper {
  title: string;
  description?: React.ReactNode;
}

const FIELD_HELPERS: Record<string, FieldHelper> = {
  analysisServerUsername: {
    title: 'Linux Username',
    description: (
      <Typography variant="body2">
        This is the value that is used as the username for the <strong>Analysis Server</strong>.
      </Typography>
    ),
  },
  mergeAlgorithm: {
    title: 'Merge Algorithm',
    description: (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="body2">
          Defines how analysis dataset metadata is merged with uploaded sample information.
        </Typography>
        <Typography variant="body2" component="div">
          <strong>• Show all:</strong> Attaches analysis labels to analysis columns and shows
          everything on a project's sample table.
        </Typography>
        <Typography variant="body2" component="div">
          <strong>• Override:</strong> Only shows the latest column from the analysis datasets,
          automatically removing duplicate columns.
        </Typography>
      </Box>
    ),
  },
  label: {
    title: 'Project Categorization',
    description: (
      <Typography variant="body2">
        A user-facing tag to categorise this project. Users can use this label to filter projects on
        the project list page.
      </Typography>
    ),
  },
};

interface FieldLabelWithTooltipProps {
  field: string;
  readableNames: Record<string, string>;
}

export function FieldLabelWithTooltip({ field, readableNames }: FieldLabelWithTooltipProps) {
  const helper = FIELD_HELPERS[field];
  const displayName = readableNames[field] || field;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const handleOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const isOpen = Boolean(anchorEl);

  // If there is no helper data at all, just return the plain name
  if (!helper) {
    return <span>{displayName}</span>;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <span className="label-text" style={{ fontWeight: 500 }}>
        {displayName}
      </span>

      <IconButton onClick={handleOpen} size="small" sx={{ p: 0.25 }}>
        <InfoOutlined color="secondary" sx={{ fontSize: '1rem' }} />
      </IconButton>

      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              p: 2,
              maxWidth: 320,
              boxShadow: 3,
              borderRadius: 2,
              bgcolor: 'background.paper',
            },
          },
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
          {helper.title}
        </Typography>
        {helper.description ? (
          helper.description
        ) : (
          <Typography variant="body2">More info about {helper.title}</Typography>
        )}
      </Popover>
    </Box>
  );
}
