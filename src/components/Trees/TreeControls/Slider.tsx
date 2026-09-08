import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';

export default function InputSlider({
  name,
  value,
  label,
  onChange,
  min,
  max,
  compact,
}: {
  name: string;
  value: number;
  label: string;
  min: number;
  max: number;
  onChange: CallableFunction;
  compact: boolean;
}) {
  const handleSliderChange = (event: Event) => {
    onChange(event);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography id="input-slider">{label}</Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs>
          <Slider
            name={name}
            value={typeof value === 'number' ? value : 0}
            onChange={handleSliderChange}
            aria-labelledby="input-slider"
            size={compact ? 'small' : 'medium'}
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
