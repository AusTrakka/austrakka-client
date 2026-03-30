import { Box, Typography } from '@mui/material';
import type { VisChainEntry } from './activityViewModels.interface';

interface LogVisChainProps {
  visChain: VisChainEntry[];
}

function LogVisChain(props: LogVisChainProps): JSX.Element {
  const { visChain } = props;
  return (
    <Box>
      {visChain
        .filter((entry) => entry.ResourceType !== 'Tenant')
        .map((entry) => (
          <Box key={entry.UniqueStringId} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              {entry.ResourceType}: {entry.UniqueStringId}
            </Typography>
          </Box>
        ))}
    </Box>
  );
}

export default LogVisChain;
