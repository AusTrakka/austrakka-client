import PivotTableChartIcon from '@mui/icons-material/PivotTableChart';
import TableChartIcon from '@mui/icons-material/TableChart';
import { Box, Button, IconButton, type IconButtonProps, styled } from '@mui/material';
import { useRef, useState } from 'react';
import { Theme } from '../../assets/themes/theme';
import { TableType } from '../ProjectOverview/ProjectSamplesTable';

type ViewSummariesToggleProps = {
  activeTable: TableType;
  setActiveTable: (table: TableType) => void;
};

interface HoverableIconButtonProps extends IconButtonProps {
  isHovered?: string;
}

const HoverableIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'isHovered',
})<HoverableIconButtonProps>(({ theme, isHovered }) => ({
  ...(isHovered === 'true' && {
    backgroundColor: theme.palette.action.hover,
  }),
}));

function ViewSummariesToggle(props: ViewSummariesToggleProps) {
  const { activeTable, setActiveTable } = props;
  const boxRef = useRef<HTMLDivElement>(null);
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
        borderRadius: 6,
        border: '1px solid',
        borderColor: isHovered ? Theme.PrimaryGrey600 : 'transparent',
        transition: 'all 0.2s ease',
        padding: isHovered ? '0px 8px 0px 8px' : '0',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleToggle}
    >
      <Button
        sx={{
          textTransform: 'none',
          color: Theme.PrimaryGrey600,
          minWidth: 0,
          borderRadius: 6,
        }}
      >
        {activeTable === TableType.RawMetadata ? (
          <>
            <PivotTableChartIcon sx={{ marginRight: 1 }} />
          </>
        ) : (
          <>
            <TableChartIcon sx={{ marginRight: 1 }} />
          </>
        )}
      </Button>
      <Box
        ref={boxRef}
        sx={{
          display: 'flex',
          alignItems: 'center',
          maxWidth: isHovered ? '200px' : '0px',
          opacity: isHovered ? 1 : 0,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          transition: 'max-width 0.25s ease-in-out, opacity 0.2s ease-in-out',
        }}
      >
        {activeTable === TableType.RawMetadata ? <>View summary table</> : <>View raw metadata</>}
      </Box>
    </Box>
  );
}

export default ViewSummariesToggle;
