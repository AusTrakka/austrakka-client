import PivotTableChartIcon from '@mui/icons-material/PivotTableChart';
import TableChartIcon from '@mui/icons-material/TableChart';
import { Button } from '@mui/material';
import { Theme } from '../../assets/themes/theme';
import { TableType } from '../ProjectOverview/ProjectSamplesTable';

type ViewSummariesToggleProps = {
  activeTable: TableType;
  setActiveTable: (table: TableType) => void;
};

function ViewSummariesToggle(props: ViewSummariesToggleProps) {
  const { activeTable, setActiveTable } = props;

  function handleToggle() {
    const table =
      activeTable === TableType.RawMetadata ? TableType.SummaryMetadata : TableType.RawMetadata;
    setActiveTable(table);
  }

  return (
    <>
      <Button
        onClick={handleToggle}
        sx={{
          textTransform: 'none',
          fontSize: '0.875rem',
          color: Theme.PrimaryGrey600,
          minWidth: 0,
          width: 40,
          borderRadius: 6,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          transition: 'width 0.2s ease-in-out',
          '&:hover': { width: 190, border: `1px solid ${Theme.PrimaryGrey600}` },
          justifyContent: 'flex-start',
        }}
      >
        {activeTable === TableType.RawMetadata ? (
          <>
            <PivotTableChartIcon sx={{ marginRight: 1 }} />
            View Summary table
          </>
        ) : (
          <>
            <TableChartIcon sx={{ marginRight: 1 }} />
            View Raw Metadata
          </>
        )}
      </Button>
    </>
  );
}

export default ViewSummariesToggle;
