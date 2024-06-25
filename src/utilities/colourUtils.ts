import * as d3 from 'd3';
import { allColorSchemes } from '../constants/schemes';
import { Legend } from '../types/phylocanvas.interface';

const NULL_COLOUR = 'rgb(200,200,200)';

function getPalette(schemeName: string, steps: number) {
  if (allColorSchemes[schemeName]) {
    const colorScale = allColorSchemes[schemeName];

    // Adjust the domain to cover the entire range from 0 to 1
    colorScale.domain([0, 1]);

    // Generate an array of evenly spaced HSL strings
    const colors = d3.range(steps).map((i) => {
      const t = i / steps;
      const hslColor = d3.hsl(colorScale(t));
      return hslColor.toString();
    });

    return colors;
  }

  return [];
}

// Creates a legend in the form of a mapping from values to hex colourstrings
export function createColourMapping(uniqueValues: string[], colorScheme: string) : Legend {
  const values = uniqueValues.filter(val => val !== '') ?? [];
  const colours = getPalette(colorScheme, values.length);
  const mapping: Legend = {};
  values.forEach((val, index) => {
    mapping[val] = colours[index];
  });
  // We did not include null in the mapping
  if (uniqueValues.includes('')) {
    mapping[''] = NULL_COLOUR;
  }
  return mapping;
}
