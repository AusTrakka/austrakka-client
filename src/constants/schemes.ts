import * as d3 from 'd3';

type ColorScheme =
Record<string, d3.ScaleSequential<string, never>> |
Record<string, d3.ScaleDiverging<string, never>>;

// Diverging Color Schemes
export const diverging: ColorScheme = {
  brownBlueGreen: d3.scaleSequential(d3.interpolateBrBG),
  purpleRedGreen: d3.scaleSequential(d3.interpolatePRGn),
  pinkYellowGreen: d3.scaleSequential(d3.interpolatePiYG),
  purpleOrange: d3.scaleSequential(d3.interpolatePuOr),
  redBlue: d3.scaleSequential(d3.interpolateRdBu),
  redGrey: d3.scaleSequential(d3.interpolateRdGy),
  redYellowBlue: d3.scaleSequential(d3.interpolateRdYlBu),
  redYellowGreen: d3.scaleSequential(d3.interpolateRdYlGn),
  spectral: d3.scaleSequential(d3.interpolateSpectral),
};

// Sequential Color Schemes
export const sequential: ColorScheme = {
  blues: d3.scaleSequential(d3.interpolateBlues),
  greens: d3.scaleSequential(d3.interpolateGreens),
  greys: d3.scaleSequential(d3.interpolateGreys),
  oranges: d3.scaleSequential(d3.interpolateOranges),
  purples: d3.scaleSequential(d3.interpolatePurples),
  reds: d3.scaleSequential(d3.interpolateReds),
  blueGreen: d3.scaleSequential(d3.interpolateBuGn),
  bluePurple: d3.scaleSequential(d3.interpolateBuPu),
  greenBlue: d3.scaleSequential(d3.interpolateYlGnBu),
  orangeRed: d3.scaleSequential(d3.interpolateYlOrRd),
  purpleBlue: d3.scaleSequential(d3.interpolateYlGnBu),
  purpleBlueGreen: d3.scaleSequential(d3.interpolateYlGnBu),
  purpleRed: d3.scaleSequential(d3.interpolateYlOrRd),
  redPurple: d3.scaleSequential(d3.interpolateRdPu),
  yellowGreen: d3.scaleSequential(d3.interpolateYlGn),
  yellowOrangeBrown: d3.scaleSequential(d3.interpolateYlOrBr),
  yellowOrangeRed: d3.scaleSequential(d3.interpolateYlOrRd),
  pinkYellowGreen: d3.scaleSequential(d3.interpolateYlGn),
};

// External Color Schemes
export const external: ColorScheme = {
  viridis: d3.scaleSequential(d3.interpolateViridis),
  magma: d3.scaleSequential(d3.interpolateMagma),
  inferno: d3.scaleSequential(d3.interpolateInferno),
  plasma: d3.scaleSequential(d3.interpolatePlasma),
  cividis: d3.scaleSequential(d3.interpolateCividis),
  rainbow: d3.scaleSequential(d3.interpolateRainbow),
  sinebow: d3.scaleSequential(d3.interpolateSinebow),
  turbo: d3.scaleSequential(d3.interpolateTurbo),
  cubeHelixDefault: d3.scaleSequential(d3.interpolateCubehelixDefault),
};

// add a type to this when we ever want to use it??
export const discrete = {
  category10: d3.schemeCategory10,
  tableau10: d3.schemeTableau10,
  accent: d3.schemeAccent,
  dark2: d3.schemeDark2,
  paired: d3.schemePaired,
  pastel1: d3.schemePastel1,
  pastel2: d3.schemePastel2,
  set1: d3.schemeSet1,
  set2: d3.schemeSet2,
  set3: d3.schemeSet3,
};

export const allColorSchemes: ColorScheme = { ...sequential, ...diverging, ...external };
