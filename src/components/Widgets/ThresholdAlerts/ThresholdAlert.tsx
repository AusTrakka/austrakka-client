import React from 'react';
import { Box, Card, Alert, Typography, Stack, CardActionArea, CardContent, AlertColor } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ThresholdAlertDTO } from '../../../types/dtos';
import theme from '../../../assets/themes/theme';

// Render a single alert

interface ThresholdAlertProps {
  alertRow: ThresholdAlertDTO;
}

const alertColours:{[key: string]: string} = {
  "No Alert": 'white',
  "Monitor": alpha(theme.palette.info.light, 0.3),
  "Review": alpha(theme.palette.warning.light, 0.3),
  "Investigate": alpha(theme.palette.error.light, 0.3),
}

export default function ThresholdAlert(props: ThresholdAlertProps)
{
  const { alertRow } = props;

  return (
    <Card variant="outlined" sx={{bgcolor: alertColours[alertRow.alertLevel]}}>
      <CardActionArea>
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


    