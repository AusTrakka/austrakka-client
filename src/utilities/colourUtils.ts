import * as d3 from 'd3';
import { allColorSchemes } from '../constants/schemes';

export default function getColorScheme(schemeName: string, steps: number) {
  if (allColorSchemes[schemeName]) {
    const colorScale = allColorSchemes[schemeName];

    // Adjust the domain to cover the entire range from 0 to 1
    colorScale.domain([0, 1]);

    // Generate an array of evenly spaced HSL strings
    const colors = d3.range(steps).map((i) => {
      const t = i / (steps - 1); // Adjust the divisor to get the desired number of steps
      const hslColor = d3.hsl(colorScale(t));
      return hslColor.toString();
    });

    return colors;
  }

  return [];
}
