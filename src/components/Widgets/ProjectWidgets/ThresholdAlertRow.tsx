import { Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import type { DataTableFilterMeta } from 'primereact/datatable';
import { useNavigate } from 'react-router-dom';
import muiTheme from '../../../assets/themes/theme';
import { updateTabUrlWithSearch } from '../../../utilities/navigationUtils';
import type { ThresholdAlert } from '../../../utilities/thresholdAlertUtils';

// Render a single alert

interface ThresholdAlertRowProps {
  alertRow: ThresholdAlert;
}

const alertColours: { [key: string]: string } = {
  'No Alert': 'white',
  // @ts-expect-error
  Monitor: alpha(muiTheme.palette.info.light, 0.3),
  // @ts-expect-error
  Review: alpha(muiTheme.palette.warning.light, 0.3),
  // @ts-expect-error
  Investigate: alpha(muiTheme.palette.error.light, 0.3),
};

export default function ThresholdAlertRow(props: ThresholdAlertRowProps) {
  const { alertRow } = props;
  const navigation = useNavigate();
  const rowClickHandler = () => {
    const drillDownFilter: DataTableFilterMeta = {
      [alertRow.categoryField]: {
        operator: FilterOperator.AND,
        constraints: [
          {
            matchMode: FilterMatchMode.EQUALS,
            value: alertRow.categoryValue,
          },
        ],
      },
    };
    updateTabUrlWithSearch(navigation, '/samples', drillDownFilter);
  };

  return (
    <Card variant="outlined" sx={{ bgcolor: alertColours[alertRow.alertLevel] }}>
      <CardActionArea onClick={() => rowClickHandler()}>
        <CardContent>
          <Stack direction="row" spacing={1} justifyContent="space-between">
            <Typography>
              {alertRow.categoryField}:<b>{alertRow.categoryValue}</b>
            </Typography>
            <Typography>
              {alertRow.ratio == null
                ? `${alertRow.alertLevel} (N=${alertRow.recentCount})`
                : `${alertRow.alertLevel} (N=${alertRow.recentCount}, ratio=${alertRow.ratio.toFixed(1)})`}
            </Typography>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
