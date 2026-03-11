import React from 'react';
import { UnfoldLess } from '@mui/icons-material';
import { Box, IconButton, Tooltip } from '@mui/material';
import { TreeTableExpandedKeysType } from 'primereact/treetable';

interface CollapseTreeNodesProps {
  expandedKeys: TreeTableExpandedKeysType | undefined;
  setExpandedKeys: (keys: TreeTableExpandedKeysType) => void;
}

function CollapseTreeNodes(props: CollapseTreeNodesProps) {
  const { expandedKeys, setExpandedKeys } = props;

  const handleCollapseAll = () => {
    setExpandedKeys({});
  };

  return (
    <Box style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      <Tooltip title="Collapse all rows" arrow>
        <IconButton
          onClick={handleCollapseAll}
          disabled={
            expandedKeys === undefined ||
            Object.keys(expandedKeys).length === 0
          }
        >
          <UnfoldLess />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export default CollapseTreeNodes;
