import { CopyAll, Search } from '@mui/icons-material';
import {
  Box,
  Chip,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { columnStyleRules } from '../../styles/metadataFieldStyles';
import CopyChip from '../Common/CopyChip';
import CustomDrawer from '../Common/CustomDrawer';

interface AllowedValuesProps {
  field: string;
  allowedValues: string[];
}

export default function AllowedValues(props: AllowedValuesProps) {
  const { allowedValues, field } = props;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [values, setValues] = useState<string[]>([]);
  const [filteredValues, setFilteredValues] = useState<string[]>([]);
  const [visibleValues, setVisibleValues] = useState<string[]>([]);
  const [remainingCount, setRemainingCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const maxVisible = 5;

  const handleMoreClick = () => {
    setDrawerOpen(true);
  };

  // Reset search and filtered values when drawer is closed
  useEffect(() => {
    if (!drawerOpen) {
      setSearchValue('');
      setFilteredValues(values);
    }
  }, [drawerOpen, values]);

  const handleListCopy = (listToCopy: string[]) => {
    navigator.clipboard.writeText(listToCopy.join(', ')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 800);
    });
  };

  // Sort allowed values alphabetically
  useEffect(() => {
    const sortedValues = [...allowedValues].sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase()),
    );
    const visibleValues = sortedValues.slice(0, maxVisible);
    const remainingCount = sortedValues.length - visibleValues.length;

    setValues(sortedValues);
    setFilteredValues(sortedValues);
    setVisibleValues(visibleValues);
    setRemainingCount(remainingCount);
  }, [allowedValues]);

  // Filter values based on search value
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value.toLowerCase();
    const filtered = values.filter((value) => value.toLowerCase().includes(searchValue));
    setFilteredValues(filtered);
    setSearchValue(searchValue);
  };

  return (
    <>
      <CustomDrawer drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen}>
        <Typography variant="subtitle2" color="textDisabled" gutterBottom>
          Field
        </Typography>
        <Typography variant="h5" color="primary">
          {field}
        </Typography>
        <Box
          style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}
          paddingBottom={2}
        >
          <Typography variant="subtitle2" color="textDisabled">
            Allowed values
          </Typography>

          <TextField
            value={searchValue}
            onChange={handleSearch}
            placeholder="Search..."
            variant="standard"
            margin="dense"
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              marginLeft: 'auto',
              width: '50%',
              '& .MuiInputBase-input': { flex: 1, minWidth: 0 },
              '& .MuiInputAdornment-root': { marginLeft: 0 },
            }}
          />

          <Tooltip title={copied ? 'Copied to clipboard!' : 'Copy list'} placement="top" arrow>
            <IconButton
              aria-label="copy-all-values"
              size="small"
              onClick={() => handleListCopy(filteredValues)}
              color={copied ? 'success' : 'default'}
              disabled={filteredValues.length === 0}
            >
              <CopyAll />
            </IconButton>
          </Tooltip>
        </Box>
        <Box
          sx={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}
          className={columnStyleRules[field]}
        >
          {filteredValues.length === 0 ? (
            <Typography variant="body2" color="textDisabled" sx={{ p: 2 }}>
              No allowed values found.
            </Typography>
          ) : (
            filteredValues.map((value) => <CopyChip key={value} value={value} />)
          )}
        </Box>
      </CustomDrawer>
      <Box sx={{ position: 'relative', width: '100%' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', overflow: 'hidden', width: '100%', pr: 4 }}>
          {visibleValues.map((value) => (
            <Box key={value} className={columnStyleRules[field]}>
              <CopyChip value={value} />
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
        <Box sx={{ position: 'absolute', top: 0, right: 0 }}>
          <Tooltip title={copied ? 'Copied to clipboard!' : 'Copy full list'} placement="top" arrow>
            <IconButton
              aria-label="copy-all-values"
              size="small"
              onClick={() => handleListCopy(values)}
              color={copied ? 'success' : 'default'}
            >
              <CopyAll sx={{ fontSize: '1em' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </>
  );
}
