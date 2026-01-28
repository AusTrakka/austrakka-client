import React from 'react';
import { Card, Typography, Stack, CardActionArea, CardContent } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { DataTableFilterMeta } from 'primereact/datatable';
import { useNavigate } from 'react-router-dom';
import { ThresholdAlert } from '../../../utilities/thresholdAlertUtils';
import muiTheme from '../../../assets/themes/theme';
import { updateTabUrlWithSearch } from '../../../utilities/navigationUtils';

// Render a single alert

interface ThresholdAlertRowProps {
  alertRow: ThresholdAlert;
}

const alertColours: { [key: string]: string } = {
  'No Alert': 'white',
  // @ts-ignore
  'Monitor': alpha(muiTheme.palette.info.light, 0.3),
  // @ts-ignore
  'Review': alpha(muiTheme.palette.warning.light, 0.3),
  // @ts-ignore
  'Investigate': alpha(muiTheme.palette.error.light, 0.3),
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
          <Stack
            direction="row"
            spacing={1}
            justifyContent="space-between"
          >
            <Typography>
              {alertRow.categoryField}
              :
              <b>{alertRow.categoryValue}</b>
            </Typography>
            <Typography>
              {(alertRow.ratio == null) ?
                `${alertRow.alertLevel} (N=${alertRow.recentCount})` :
                `${alertRow.alertLevel} (N=${alertRow.recentCount}, ratio=${alertRow.ratio.toFixed(1)})`}
            </Typography>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
