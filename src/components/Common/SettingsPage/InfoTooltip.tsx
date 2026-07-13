import { Info } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { Theme } from '../../../assets/themes/theme';

interface InfoTooltipProps {
  title: string;
  fontSize?: 'inherit' | 'small' | 'medium' | 'large';
  color?: string;
}

export function InfoTooltip({ title, fontSize = 'small', color }: InfoTooltipProps) {
  return (
    <Tooltip title={title}>
      <Info
        fontSize={fontSize}
        sx={{
          color: color || Theme.PrimaryGrey500,
          verticalAlign: 'middle',
        }}
      />
    </Tooltip>
  );
}
