import { TreeMetadata } from '../components/Trees/PhylocanvasGL';
import { AnalysisResultMetadata } from '../types/dtos';

// Convert metadate into phylocanvas format
export default function mapMetadataToPhylocanvas(dataArray: AnalysisResultMetadata[]) {
  let colorIndex = 0;
  const valueColorMap: Record<string, string> = {};

  function getUniqueColor(value: string): string {
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

  const result: TreeMetadata = {};
  for (const data of dataArray) {
    result[data.sampleId] = {};
    for (const metadataValue of data.metadataValues) {
      result[data.sampleId][metadataValue.key] = {
        colour: getUniqueColor(metadataValue.value),
        label: metadataValue.value,
      };
    }
  }
  return result;
}
