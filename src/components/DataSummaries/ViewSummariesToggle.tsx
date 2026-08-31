import PivotTableChartIcon from '@mui/icons-material/PivotTableChart';
import TableChartIcon from '@mui/icons-material/TableChart';
import { Box, Button, Typography } from '@mui/material';
import { useState } from 'react';
import { Theme } from '../../assets/themes/theme';
import { TableType } from '../ProjectOverview/ProjectSamplesTable';

type ViewSummariesToggleProps = {
  activeTable: TableType;
  setActiveTable: (table: TableType) => void;
};

function ViewSummariesToggle(props: ViewSummariesToggleProps) {
  const { activeTable, setActiveTable } = props;
  const [isHovered, setIsHovered] = useState(false);

  function handleToggle() {
    const table =
      activeTable === TableType.RawMetadata ? TableType.SummaryMetadata : TableType.RawMetadata;
    setActiveTable(table);
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        cursor: 'pointer',
        borderRadius: 2,
        backgroundColor: isHovered ? Theme.PrimaryGrey700 : 'transparent',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleToggle}
    >
      <Button
        sx={{
          textTransform: 'none',
          color: isHovered ? 'white' : Theme.PrimaryGrey700,
          minWidth: 0,
          borderRadius: 6,
        }}
      >
        {activeTable === TableType.RawMetadata ? (
          <>
            <PivotTableChartIcon />
            <Typography
              variant="body2"
              sx={{ color: isHovered ? 'white' : Theme.PrimaryGrey700, pl: 1 }}
            >
              View summary table
            </Typography>
          </>
        ) : (
          <>
            <TableChartIcon />
            <Typography
              variant="body2"
              sx={{ color: isHovered ? 'white' : Theme.PrimaryGrey700, pl: 1 }}
            >
              View raw metadata
            </Typography>
          </>
        )}
      </Button>
    </Box>
  );
}

export default ViewSummariesToggle;
