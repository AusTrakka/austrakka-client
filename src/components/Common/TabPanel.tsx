import { Box, LinearProgress } from '@mui/material';
import React, { memo, useEffect, useState } from 'react';

type WithSetIsLoading = {
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

interface TabPanelProps {
  index: number;
  value: number;
  loadingState?: boolean;
  setIsLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  children: React.ReactNode;
}

function TabPanel({ children, value, index, loadingState, setIsLoading }: TabPanelProps) {
  const [visited, setVisited] = useState(false);
  const isActive = value === index;

  useEffect(() => {
    if (isActive) setVisited(true);
  }, [isActive]);

  if (!visited) return null;

  const loading = loadingState ?? false;

  const childElement =
    setIsLoading && React.isValidElement<WithSetIsLoading>(children)
      ? React.cloneElement(children, { setIsLoading })
      : children;

  return (
    <div role="tabpanel" id={`simple-tabpanel-${index}`} aria-labelledby={`simple-tab-${index}`}>
      {loading && <LinearProgress color="secondary" />}
      <Box hidden={!isActive || loading} sx={{ marginTop: 2 }}>
        {childElement}
      </Box>
    </div>
  );
}

export default memo(TabPanel);
