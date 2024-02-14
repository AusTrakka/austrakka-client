/* eslint-disable no-plusplus */
import { PhylocanvasLegends, PhylocanvasMetadata } from '../types/phylocanvas.interface';
import { ProjectField } from '../types/dtos';
import getColorScheme from './colourUtils';
import { Sample } from '../types/sample.interface';
import { SAMPLE_ID_FIELD } from '../constants/metadataConsts';

const NULL_COLOUR = 'rgb(200,200,200)';

export default function mapMetadataToPhylocanvas(
  dataArray: Sample[],
  fieldInformation: ProjectField[],
  fieldUniqueValues: Record<string, string[] | null>,
  colorSchemeSelected: string,
) {
  // Create categorical colour palettes based on unique values
  // Note that to create numeric schemes we would need to know the max and min values
  const metadataColumnPalettes: PhylocanvasLegends = {};
  fieldInformation
    .filter((fi) => fi.canVisualise)
    .forEach((fi) => {
      const values = fieldUniqueValues[fi.fieldName]?.filter(val => val !== 'null') ?? [];
      const colours = getColorScheme(colorSchemeSelected, values.length);
      metadataColumnPalettes[fi.fieldName] = {};
      values.forEach((val, index) => {
        metadataColumnPalettes[fi.fieldName][val] = colours[index];
      });
      if (fieldUniqueValues[fi.fieldName]?.includes('null')) {
        metadataColumnPalettes[fi.fieldName].null = NULL_COLOUR;
      }
    });

  const result: PhylocanvasMetadata = {};
  for (const sample of dataArray) {
    const sampleName = sample[SAMPLE_ID_FIELD];
    result[sampleName] = {};

    fieldInformation.forEach((fi) => {
      if (fi.fieldName !== SAMPLE_ID_FIELD) {
        const value = sample[fi.fieldName] ?? 'null';
        const colour = fi.canVisualise ?
          metadataColumnPalettes[fi.fieldName][value]
          : 'rgba(0,0,0,0)'; // this black is assigned but we expect not to be used, as the field is not visualisable
        result[sampleName][fi.fieldName] = {
          colour,
          label: sample[fi.fieldName] ?? '',
        };
      }
    });
  }

  const metadataAndLegends = {
    result,
    legends: metadataColumnPalettes,
  };
  return metadataAndLegends;
}
