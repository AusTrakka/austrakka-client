import React, { useState, memo } from 'react';
import { List, ListItem, Collapse, Typography, Box } from '@mui/material';
import { KeyboardArrowDown } from '@mui/icons-material';
import { Theme } from '../../assets/themes/theme';

type JsonTreeViewProps = {
  data: JSON; // The JSON data to display
  treeKey?: any; // Unique key for the tree instance
  label?: string; // Allows for custom label of root node
  level?: number; // Indentation level for nested nodes
  hiddenKeys?: string[]; // Custom hidden keys at all tree levels
  removeNulls?: boolean; // Whether to remove null/undefined values from the tree
};

// TODO: Update removeNulls to support arrays as empty rather than removing items

function JsonTreeView(props: JsonTreeViewProps) {
  const { data, treeKey, label, level = 0, hiddenKeys = [], removeNulls = true } = props;
  const [open, setOpen] = useState(false);

  const shouldHideNullValue = (value: any) => {
    if (!removeNulls) return false;
    return value === null || value === undefined;
  };

  const isObject = (entry: any) => entry && typeof entry === 'object' && !Array.isArray(entry);

  // Build entries for objects and arrays
  const buildEntries = (entry: any): [any, any][] => {
    // Handle arrays
    if (Array.isArray(entry)) {
      return entry
        .filter(item => !shouldHideNullValue(item))
        .map(item => {
          if (!isObject(item)) {
            return [null, item]; // primitive array item
          }
          const visibleKeys = Object.keys(item).filter(key => !hiddenKeys.includes(key));

          // Don't expand if singular key-value pair
          if (visibleKeys.length === 1) {
            const key = visibleKeys[0];
            const value = item[key];
            return [key, value];
          }

          // Expand multiple key-value pairs and use first key as label
          // This may not be the most effective way to label as
          // the first key may always be the most informative
          const firstKey = visibleKeys[0];
          return [firstKey, item];
        });
    }
    // Handle objects
    if (isObject(entry)) {
      return Object.entries(entry).filter(
        ([key, val]) => !hiddenKeys.includes(key) && !shouldHideNullValue(val),
      );
    }

    return [];
  };
  
  // Render primitive values
  if (!isObject(data) && !Array.isArray(data)) {
    if (shouldHideNullValue(data)) return null;
    return (
      <ListItem sx={{ pl: level * 3 }}>
        <Typography variant="body2">
          <strong>{label ? `${label}: ` : ''}</strong>
          {String(data)}
        </Typography>
      </ListItem>
    );
  }
  const entries = buildEntries(data);
  if (entries.length === 0) return null;

  const childCount = entries.length;
  const hasChildren = childCount > 0;

  return (
    <Box
      sx={{
        'pl': level === 0 && open ? 1 : 0,
        'transition': theme =>
          theme.transitions.create(['padding-left', 'background-color'], {
            duration: theme.transitions.duration.shortest,
            easing: theme.transitions.easing.easeInOut,
          }),
        'backgroundColor': open ? Theme.PrimaryGrey50 : 'transparent',
        'borderRadius': 2,
        'mb': 1,
      }}
    >
      <ListItem
        onClick={() => setOpen(!open)}
        sx={{
          pl: level * 3,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {label}
          {!open && hasChildren && ` (${childCount})`}
        </Typography>
        <KeyboardArrowDown
          sx={{
            'fontSize': 'large',
            'color': open ? Theme.PrimaryMain : Theme.PrimaryGrey500,
            'transform': open ? 'rotate(180deg)' : 'rotate(0deg)',
            'transition': 'transform 0.25s ease-in-out',
          }}
        />
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List disablePadding dense>
          {entries.map(([key, value], index) => {
            const elementKey = `${key}-${index}`;

            return (
              <React.Fragment key={elementKey}>
                <JsonTreeView
                  treeKey={treeKey}
                  label={key}
                  data={value}
                  level={level + 1}
                  hiddenKeys={hiddenKeys}
                  removeNulls={removeNulls}
                />
              </React.Fragment>
            );
          })}
        </List>
      </Collapse>
    </Box>
  );
}

export default memo(JsonTreeView);
