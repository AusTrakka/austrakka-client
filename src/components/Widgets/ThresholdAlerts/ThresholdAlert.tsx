import React from 'react';
import { Card, Typography, Stack, CardActionArea, CardContent } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ThresholdAlertDTO } from '../../../types/dtos';
import theme from '../../../assets/themes/theme';

// Render a single alert

interface ThresholdAlertProps {
  alertRow: ThresholdAlertDTO;
  setFilterList: Function,
  setTabValue: Function,
}

const alertColours:{ [key: string]: string } = {
  'No Alert': 'white',
  // @ts-ignore
  'Monitor': alpha(theme.palette.info.light, 0.3),
  // @ts-ignore
  'Review': alpha(theme.palette.warning.light, 0.3),
  // @ts-ignore
  'Investigate': alpha(theme.palette.error.light, 0.3),
};

export default function ThresholdAlert(props: ThresholdAlertProps) {
  const { alertRow, setFilterList, setTabValue } = props;

  const rowClickHandler = () => {
    const drilldownFilter = [{
      field: alertRow.categoryField,
      fieldType: 'string',
      condition: '==*',
      value: alertRow.categoryValue,
    }];
    setFilterList(drilldownFilter);
    setTabValue(1); // Navigate to "Samples" tab
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
