import React from 'react';
import { UnfoldLess, UnfoldMore } from '@mui/icons-material';
import { Box, IconButton, Tooltip } from '@mui/material';
import { TreeTableExpandedKeysType } from 'primereact/treetable';
import { TreeNode } from 'primereact/treenode';

interface CollapseTreeNodesProps {
  allNodes: TreeNode[];
  expandedKeys: TreeTableExpandedKeysType | undefined;
  setExpandedKeys: (keys: TreeTableExpandedKeysType | undefined) => void;
}

function CollapseExpandTreeNodes(props: CollapseTreeNodesProps) {
  const { allNodes, expandedKeys, setExpandedKeys } = props;

  const getAllNodeKeys = (nodes: TreeNode[], keys: string[] = []): string[] => {
    for (const node of nodes) {
      if (typeof node.key === 'string') {
        keys.push(node.key);
      }
      if (node.children) {
        getAllNodeKeys(node.children, keys);
      }
    }
    return keys;
  };

  // Helper to recursively check if any node has children
  const hasAnyChildren = (nodes: TreeNode[]): boolean => {
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        return true;
      }
      if (node.children && hasAnyChildren(node.children)) {
        return true;
      }
    }
    return false;
  };

  const anyHasChildren = hasAnyChildren(allNodes);

  const handleCollapseAll = () => {
    setExpandedKeys({});
  };

  const handleExpandAll = () => {
    const allKeys = getAllNodeKeys(allNodes);
    const newExpandedKeys: TreeTableExpandedKeysType = {};
    allKeys.forEach(key => {
      newExpandedKeys[key] = true;
    });
    setExpandedKeys(newExpandedKeys);
  };

  return (
    <Box style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
      <Tooltip title="Collapse all rows" arrow>
        <IconButton
          onClick={handleCollapseAll}
          disabled={
            !anyHasChildren ||
            expandedKeys === undefined ||
            Object.keys(expandedKeys).length === 0
          }
        >
          <UnfoldLess />
        </IconButton>
      </Tooltip>
      <Tooltip title="Expand all rows" arrow>
        <IconButton
          onClick={handleExpandAll}
          disabled={
            !anyHasChildren ||
            (expandedKeys !== undefined &&
            Object.keys(expandedKeys).length === getAllNodeKeys(allNodes).length)
          }
        >
          <UnfoldMore />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export default CollapseExpandTreeNodes;
