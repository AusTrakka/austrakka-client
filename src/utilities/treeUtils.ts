import { PhylocanvasLegends, PhylocanvasMetadata } from '../types/phylocanvas.interface';
import { AnalysisResultMetadata } from '../types/dtos';

// Convert metadate into phylocanvas format
export default function mapMetadataToPhylocanvas(dataArray: AnalysisResultMetadata[]) {
  let colorIndex = 0;
  const valueColorMap: Record<string, string> = {};

  function getUniqueColor(value: string): string {
    if (!value) {
      return 'rgba(0,0,0,0)';
    }
    // Check if value was already mapped to a color
    if (valueColorMap[value]) {
      return valueColorMap[value];
    }

    // Generate a unique color (here we use HSL colors for simplicity)
    const color = `hsl(${(colorIndex * 15) % 360}, 100%, 50%)`;

    // Increment the color index and store the color mapping
    colorIndex += 1;
    valueColorMap[value] = color;

    return color;
  }

  const result: PhylocanvasMetadata = {};
  const legends: PhylocanvasLegends = {};
  for (const data of dataArray) {
    result[data.sampleName] = {};
    for (const metadataValue of data.metadataValues) {
      const uColour = getUniqueColor(metadataValue.value);
      result[data.sampleName][metadataValue.key] = {
        colour: uColour,
        label: metadataValue.value,
      };
      if (!legends[metadataValue.key]) {
        legends[metadataValue.key] = {}; // Initialize if it doesn't exist
      }
      legends[metadataValue.key][uColour] = metadataValue.value;
    }
  }
  const metadataAndLegends = {
    result,
    legends,
  };

  return metadataAndLegends;
}
