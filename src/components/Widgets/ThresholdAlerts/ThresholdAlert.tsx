import React from 'react';
import { Box, Card, Alert, Typography, Stack, CardActionArea, CardContent, AlertColor } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ThresholdAlertDTO } from '../../../types/dtos';
import theme from '../../../assets/themes/theme';

// Render a single alert

interface ThresholdAlertProps {
  alertRow: ThresholdAlertDTO;
  setFilterList: Function,
  setTabValue: Function,
}

const alertColours:{[key: string]: string} = {
  "No Alert": 'white',
  "Monitor": alpha(theme.palette.info.light, 0.3),
  "Review": alpha(theme.palette.warning.light, 0.3),
  "Investigate": alpha(theme.palette.error.light, 0.3),
}

export default function ThresholdAlert(props: ThresholdAlertProps)
{
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
    <Card variant="outlined" sx={{bgcolor: alertColours[alertRow.alertLevel]}}>
      <CardActionArea onClick={() => rowClickHandler()}>
        <CardContent>
        <Stack direction="row" 
              spacing={1}
              justifyContent="space-between">
            <Typography>
              {alertRow.categoryField}:<b>{alertRow.categoryValue}</b>
            </Typography>
            <Typography>
              {(alertRow.ratio == null) ?
                alertRow.alertLevel :
                `${alertRow.alertLevel} (ratio=${alertRow.ratio.toFixed(1)})`}
            </Typography>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}


    