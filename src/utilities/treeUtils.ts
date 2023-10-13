/* eslint-disable no-plusplus */
import { PhylocanvasLegends, PhylocanvasMetadata } from '../types/phylocanvas.interface';
import { AnalysisResultMetadata, DisplayField } from '../types/dtos';

export default function mapMetadataToPhylocanvas(
  dataArray: AnalysisResultMetadata[],
  fieldInformation: DisplayField[],
) {
  // A dictionary to store the colour palettes for each metadata column
  const metadataColumnPalettes: Record<string, string[]> = {};

  function generateSequentialColourPalette(baseColour: any, numberOfColours: number) {
    const colours = [];
    const baseHue = baseColour.h;
    const hueDifference = 360 / numberOfColours;

    for (let i = 0; i < numberOfColours; i++) {
      // Calculate the hue for each colour with larger gaps for distinctiveness
      // (whatever you times hueDifference with is the gap)
      const hue = (baseHue + i * (hueDifference * 2)) % 360;

      // Create an HSL colour string with fixed saturation and lightness values
      const colour = `hsl(${hue}, ${baseColour.s}%, ${baseColour.l}%)`;

      colours.push(colour);
    }

    return colours;
  }

  function generateDistinctColourPalette(baseColour : any, numberOfColours: number) {
    const colours = [];
    const goldenAngle = 137.508; // Golden angle in degrees

    for (let i = 0; i < numberOfColours; i++) {
      const hue = baseColour.h + ((i * goldenAngle) % 360); // Use the golden angle to increment hue
      const colour = `hsl(${hue}, ${baseColour.s}%, ${baseColour.l}%)`;
      colours.push(colour);
    }

    return colours;
  }

  function getUniqueColour(
    value: string,
    metadataColumn: string,
    fieldInfo: string | undefined,
  ): string {
    if (!value) {
      return 'rgba(0,0,0,0)';
    }

    // Check if the palette for the current metadata column exists, or generate one
    if (!metadataColumnPalettes[metadataColumn]) {
      // Define the base colour for the current metadata column
      const baseColour = {
        h: Math.random() * 360, // Random hue value between 0 and 359
        s: 60, // Adjust saturation as needed
        l: 50, // Adjust lightness as needed
      };

      // Check if the value is an integer (numeric string)
      const isNumericString = fieldInfo === 'number';

      // Generate a harmonious colour palette for the current metadata column
      // or distinct palette if it is not an number
      metadataColumnPalettes[metadataColumn] = isNumericString
        ? generateSequentialColourPalette(baseColour, dataArray.length)
        : generateDistinctColourPalette(baseColour, dataArray.flatMap((data) =>
          data.metadataValues
            .filter((metadataValue) => metadataValue.key === metadataColumn)
            .map((metadataValue) => metadataValue.value)).length);
    }

    const palette = metadataColumnPalettes[metadataColumn];

    // Find the index for the current value in the metadata column
    const index = dataArray.findIndex((data) =>
      data.metadataValues.some((metadataValue) =>
        metadataValue.key === metadataColumn && metadataValue.value === value));

    const colour = palette[index % palette.length] || 'rgba(0,0,0,0)';

    return colour;
  }

  const result: PhylocanvasMetadata = {};
  const legends: PhylocanvasLegends = {};

  for (const data of dataArray) {
    result[data.sampleName] = {};

    for (const metadataValue of data.metadataValues) {
      const field = fieldInformation.find(di => di.columnName === metadataValue.key);
      const uColour = getUniqueColour(metadataValue.value, metadataValue.key, field?.primitiveType);
      result[data.sampleName][metadataValue.key] = {
        colour: uColour,
        label: metadataValue.value,
      };
      if (metadataValue.value !== null) {
        if (!legends[metadataValue.key]) {
          legends[metadataValue.key] = {}; // Initialize if it doesn't exist
        }

        legends[metadataValue.key][uColour] = metadataValue.value;
      }
    }
  }

  const metadataAndLegends = {
    result,
    legends,
  };
  return metadataAndLegends;
}
