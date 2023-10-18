/* eslint-disable no-plusplus */
import { createPalette, ColorMapInput } from 'hue-map';
import { PhylocanvasLegends, PhylocanvasMetadata } from '../types/phylocanvas.interface';
import { AnalysisResultMetadata, DisplayField } from '../types/dtos';

export default function mapMetadataToPhylocanvas(
  dataArray: AnalysisResultMetadata[],
  fieldInformation: DisplayField[],
  colorMap: ColorMapInput,
) {
  // A dictionary to store the colour palettes for each metadata column
  const metadataColumnPalettes: PhylocanvasLegends = {};

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

  function hashCode(str : string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      // eslint-disable-next-line no-bitwise
      hash = (hash << 5) - hash + char;
    }
    return Math.abs(hash);
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
      const stringHash = hashCode(metadataColumn);
      const baseColour = {
        h: stringHash % 360, // Random hue value between 0 and 359
        s: 60, // Adjust saturation as needed
        l: 50, // Adjust lightness as needed
      };

      // Check if the value is an integer (numeric string)z
      const isNumericString = fieldInfo === 'number' || fieldInfo === 'float';

      const values = dataArray.flatMap((data) =>
        data.metadataValues
          .filter((metadataValue) => metadataValue.key === metadataColumn)
          .map((metadataValue) => metadataValue.value));

      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
      const uniqueValues = [...new Set(values)]
        .sort(collator.compare);

      const colours = isNumericString ?
        generateSequentialColourPalette(baseColour, uniqueValues.length) :
        createPalette({ map: colorMap, steps: uniqueValues.length }).format('cssRGBA');

      metadataColumnPalettes[metadataColumn] = {};
      uniqueValues.forEach((val, index) => {
        metadataColumnPalettes[metadataColumn][val] = colours[index];
      });
    }

    const palette = metadataColumnPalettes[metadataColumn];

    const colour = palette[value] || 'rgba(0,0,0,0)';

    return colour;
  }

  const result: PhylocanvasMetadata = {};
  for (const data of dataArray) {
    result[data.sampleName] = {};

    for (const metadataValue of data.metadataValues) {
      const field = fieldInformation.find(di => di.columnName === metadataValue.key);
      if (field?.canVisualise) {
        const uColour = getUniqueColour(
          metadataValue.value,
          metadataValue.key,
          field?.primitiveType,
        );
        result[data.sampleName][metadataValue.key] = {
          colour: uColour,
          label: metadataValue.value,
        };
      }
    }
  }

  const metadataAndLegends = {
    result,
    legends: metadataColumnPalettes,
  };
  return metadataAndLegends;
}
