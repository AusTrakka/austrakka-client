import * as React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';

export default function InputSlider(
  { name, value, label, onChange, min, max }: {
    name: string,
    value: number,
    label: string,
    min: number,
    max: number,
    onChange: CallableFunction },
) {
  const handleSliderChange = (event: Event) => {
    onChange(event);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography id="input-slider">
        {label}
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs>
          <Slider
            name={name}
            value={typeof value === 'number' ? value : 0}
            onChange={handleSliderChange}
            aria-labelledby="input-slider"
            min={min}
            max={max}
          />
        </Grid>
        <Grid item>
          <Typography id="input-slider-value" gutterBottom>
            {value}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}
