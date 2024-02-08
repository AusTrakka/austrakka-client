/* eslint-disable no-plusplus */
import { PhylocanvasLegends, PhylocanvasMetadata } from '../types/phylocanvas.interface';
import { MetaDataColumn } from '../types/dtos';
import getColorScheme from './colourUtils';
import { ProjectSample } from '../types/sample.interface';
import { SAMPLE_ID_FIELD } from '../constants/metadataConsts';

const NULL_COLOUR = 'rgb(200,200,200)';

export default function mapMetadataToPhylocanvas(
  dataArray: ProjectSample[],
  fieldInformation: MetaDataColumn[],
  fieldUniqueValues: Record<string, string[] | null>,
  colorSchemeSelected: string,
) {
  // Create categorical colour palettes based on unique values
  // Note that to create numeric schemes we would need to know the max and min values
  const metadataColumnPalettes: PhylocanvasLegends = {};
  fieldInformation
    .filter((fi) => fi.canVisualise)
    .forEach((fi) => {
      const values = fieldUniqueValues[fi.columnName]?.filter(val => val !== 'null') ?? [];
      const colours = getColorScheme(colorSchemeSelected, values.length);
      metadataColumnPalettes[fi.columnName] = {};
      values.forEach((val, index) => {
        metadataColumnPalettes[fi.columnName][val] = colours[index];
      });
      if (fieldUniqueValues[fi.columnName]?.includes('null')) {
        metadataColumnPalettes[fi.columnName]['null'] = NULL_COLOUR;
      }
    });

  const result: PhylocanvasMetadata = {};
  for (const sample of dataArray) {
    const sampleName = sample[SAMPLE_ID_FIELD];
    result[sampleName] = {};

    fieldInformation.forEach((fi) => {
      if (fi.columnName !== SAMPLE_ID_FIELD) {
        const value = sample[fi.columnName] ?? 'null';
        const colour = fi.canVisualise ?
          metadataColumnPalettes[fi.columnName][value]
          : 'rgba(0,0,0,0)'; // this black is assigned but we expect not to be used, as the field is not visualisable
        result[sampleName][fi.columnName] = {
          colour,
          label: sample[fi.columnName] ?? '',
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
