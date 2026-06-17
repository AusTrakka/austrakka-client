import { InfoOutlined } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import { Theme } from '../../../../assets/themes/theme';

interface ChartInfoTooltipProps {
  text?: string;
}

export function ChartInfoTooltip({
  text = 'Click legend items to show/hide · Hover for details',
}: ChartInfoTooltipProps) {
  return (
    <Tooltip title={<span style={{ whiteSpace: 'pre-line' }}>{text}</span>} arrow placement="top">
      <IconButton size="small" sx={{ p: 0, color: Theme.PrimaryGrey500 }}>
        <InfoOutlined fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}

export default ChartInfoTooltip;
