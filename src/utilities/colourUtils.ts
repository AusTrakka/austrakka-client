import * as d3 from 'd3';
import { allColorSchemes, discreteColorSchemes, rangeColorSchemes, valueMappedColorSchemes } from '../constants/schemes';
import { Legend } from '../types/phylocanvas.interface';

export const NULL_COLOUR = import.meta.env.VITE_THEME_PRIMARY_GREY_500;

function getPaletteForRangeColorScheme(schemeName: string, values: string[]): Legend {
  const colorScale = rangeColorSchemes[schemeName];
  if (colorScale) {
    // Use d3.quantize to generate evenly spaced values over the domain [0, 1]
    const colours = d3.quantize(colorScale, values.length);
    const mapping: Legend = {};
    values.forEach((val, index) => {
      mapping[val] = colours[index];
    });
    return mapping;
  }
  return {};
}

function getPaletteForDiscreteColorScheme(schemeName: string, values: string[]): Legend {
  if (discreteColorSchemes[schemeName]) {
    const colorsScheme = discreteColorSchemes[schemeName];
    if (!valueMappedColorSchemes.has(schemeName)) {
      // This is not a colour scheme with pre-defined values; reset the domain
      colorsScheme.domain(values);
    }
    
    const mapping: Legend = {};
    values.forEach((val) => {
      mapping[val] = colorsScheme(val);
    });
    return mapping;
  }
  return {};
}

// Create a mapping of unique_values to colours
export function createColourMapping(uniqueValues: string[], colorScheme: string) : Legend {
  // Check if the color scheme exists
  if (!allColorSchemes[colorScheme]) {
    throw new Error(`Color scheme ${colorScheme} not found`);
  }
  
  // filter out empty strings
  const values = uniqueValues.filter(val => val !== '') ?? [];
  
  // create a palette of depending on the type of color scheme
  const mapping = rangeColorSchemes[colorScheme] ?
    getPaletteForRangeColorScheme(colorScheme, values) :
    getPaletteForDiscreteColorScheme(colorScheme, values);
  // We did not include null in the mapping
  
  if (uniqueValues.includes('')) {
    mapping[''] = NULL_COLOUR;
  }
  return mapping;
}

export function generateColorSchemeThumbnail(schemeName: string): string[] {
  if (!allColorSchemes[schemeName]) return [];
  
  if (discrete[schemeName]) {
    const domain = discrete[schemeName].range();
    return domain.slice(0, 5);
  }
  
  return d3.quantize(rangeColorSchemes[schemeName], 5);
}
