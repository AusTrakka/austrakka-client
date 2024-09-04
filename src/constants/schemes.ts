import * as d3 from 'd3';

// I don't know if this a good structure for types, but it works for now
export type ColorSchemeRange = Record<string,
d3.ScaleSequential<string, never> |
d3.ScaleDiverging<string, never>>;

export type ColorSchemeDiscrete = Record<string,
d3.ScaleOrdinal<string, string>>;

type ColorSchemeAll = Record<string,
d3.ScaleOrdinal<string, string> |
d3.ScaleSequential<string, never> |
d3.ScaleDiverging<string, never>>;

// Colorblind friendly color scheme
const schemeColorBlindFriendly: string[] =
    [
      '#000000',
      '#e69f00',
      '#56b4e9',
      '#009e73',
      '#f0e442',
      '#0072b2',
      '#d55e00',
      '#cc79a7',
    ];

// Diverging Color Schemes
export const diverging: ColorSchemeRange = {
  brownBlueGreen: d3.scaleDiverging(d3.interpolateBrBG),
  purpleRedGreen: d3.scaleDiverging(d3.interpolatePRGn),
  purpleOrange: d3.scaleDiverging(d3.interpolatePuOr),
  redBlue: d3.scaleDiverging(d3.interpolateRdBu),
  redGrey: d3.scaleDiverging(d3.interpolateRdGy),
  redYellowBlue: d3.scaleDiverging(d3.interpolateRdYlBu),
  redYellowGreen: d3.scaleDiverging(d3.interpolateRdYlGn),
  yellowOrangeBrown: d3.scaleDiverging(d3.interpolateYlOrBr),
  yellowOrangeRed: d3.scaleDiverging(d3.interpolateYlOrRd),
  pinkYellowGreen: d3.scaleDiverging(d3.interpolatePiYG),
  purpleBlueGreen: d3.scaleDiverging(d3.interpolatePuBuGn),
};

// Sequential Color Schemes
export const sequential: ColorSchemeRange = {
  blues: d3.scaleSequential(d3.interpolateBlues),
  greens: d3.scaleSequential(d3.interpolateGreens),
  greys: d3.scaleSequential(d3.interpolateGreys),
  oranges: d3.scaleSequential(d3.interpolateOranges),
  purples: d3.scaleSequential(d3.interpolatePurples),
  reds: d3.scaleSequential(d3.interpolateReds),
  blueGreen: d3.scaleSequential(d3.interpolateBuGn),
  bluePurple: d3.scaleSequential(d3.interpolateBuPu),
  greenBlue: d3.scaleSequential(d3.interpolateYlGnBu),
  orangeRed: d3.scaleSequential(d3.interpolateOrRd),
  purpleBlue: d3.scaleSequential(d3.interpolatePuBu),
  purpleRed: d3.scaleSequential(d3.interpolatePuRd),
  redPurple: d3.scaleSequential(d3.interpolateRdPu),
  yellowGreen: d3.scaleSequential(d3.interpolateYlGn),
};

// External Color Schemes
export const external: ColorSchemeRange = {
  viridis: d3.scaleSequential(d3.interpolateViridis),
  magma: d3.scaleSequential(d3.interpolateMagma),
  inferno: d3.scaleSequential(d3.interpolateInferno),
  plasma: d3.scaleSequential(d3.interpolatePlasma),
  cividis: d3.scaleSequential(d3.interpolateCividis),
  rainbow: d3.scaleSequential(d3.interpolateRainbow),
  sinebow: d3.scaleSequential(d3.interpolateSinebow),
  spectral: d3.scaleSequential(d3.interpolateSpectral),
  turbo: d3.scaleSequential(d3.interpolateTurbo),
  cubeHelixDefault: d3.scaleSequential(d3.interpolateCubehelixDefault),
};

// add a type to this when we ever want to use it??
export const discrete: ColorSchemeDiscrete = {
  category10: d3.scaleOrdinal(d3.schemeCategory10),
  tableau10: d3.scaleOrdinal(d3.schemeTableau10),
  accent: d3.scaleOrdinal(d3.schemeAccent),
  dark2: d3.scaleOrdinal(d3.schemeDark2),
  paired: d3.scaleOrdinal(d3.schemePaired),
  pastel1: d3.scaleOrdinal(d3.schemePastel1),
  pastel2: d3.scaleOrdinal(d3.schemePastel2),
  set1: d3.scaleOrdinal(d3.schemeSet1),
  set2: d3.scaleOrdinal(d3.schemeSet2),
  set3: d3.scaleOrdinal(d3.schemeSet3),
  colorBlindSet8: d3.scaleOrdinal(schemeColorBlindFriendly),
};

export const rangeColorSchemes: ColorSchemeRange = { ...sequential, ...diverging, ...external };
export const discreteColorSchemes: ColorSchemeDiscrete = { ...discrete };
export const allColorSchemes: ColorSchemeAll = { ...rangeColorSchemes, ...discreteColorSchemes };

// Enum to map color variables to color schemes names in readable format
export enum ColorSchemeNames {
  // Sequential
  blues = 'Blues',
  greens = 'Greens',
  greys = 'Greys',
  oranges = 'Oranges',
  purples = 'Purples',
  reds = 'Reds',
  blueGreen = 'Blue-Green',
  bluePurple = 'Blue-Purple',
  greenBlue = 'Green-Blue',
  orangeRed = 'Orange-Red',
  purpleBlue = 'Purple-Blue',
  purpleRed = 'Purple-Red',
  redPurple = 'Red-Purple',
  yellowGreen = 'Yellow-Green',
  // Diverging
  brownBlueGreen = 'Brown-Blue-Green',
  purpleRedGreen = 'Purple-Red-Green',
  purpleOrange = 'Purple-Orange',
  redBlue = 'Red-Blue',
  redGrey = 'Red-Grey',
  redYellowBlue = 'Red-Yellow-Blue',
  redYellowGreen = 'Red-Yellow-Green',
  yellowOrangeBrown = 'Yellow-Orange-Brown',
  yellowOrangeRed = 'Yellow-Orange-Red',
  pinkYellowGreen = 'Pink-Yellow-Green',
  purpleBlueGreen = 'Purple-Blue-Green',
  // External
  viridis = 'Viridis',
  magma = 'Magma',
  inferno = 'Inferno',
  plasma = 'Plasma',
  cividis = 'Cividis',
  rainbow = 'Rainbow',
  sinebow = 'Sinebow',
  turbo = 'Turbo',
  cubeHelixDefault = 'CubeHelixDefault',
  spectral = 'Spectral',
  // Discrete
  category10 = 'Category10',
  tableau10 = 'Tableau10',
  accent = 'Accent',
  dark2 = 'Dark2',
  paired = 'Paired',
  pastel1 = 'Pastel1',
  pastel2 = 'Pastel2',
  set1 = 'Set1',
  set2 = 'Set2',
  set3 = 'Set3',
  // CUSTOM
  colorBlindSet8 = 'ColorBlind8',
}
