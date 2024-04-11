/* eslint-disable no-plusplus */
import { PhylocanvasLegends, PhylocanvasMetadata } from '../types/phylocanvas.interface';
import { Field } from '../types/dtos';
import getColorScheme from './colourUtils';
import { Sample } from '../types/sample.interface';
import { SAMPLE_ID_FIELD } from '../constants/metadataConsts';
import { isoDateLocalDate, isoDateLocalDateNoTime } from './helperUtils';

const NULL_COLOUR = 'rgb(200,200,200)';

export default function mapMetadataToPhylocanvas(
  dataArray: Sample[],
  fieldInformation: Field[],
  fieldUniqueValues: Record<string, string[] | null>,
  colorSchemeSelected: string,
) {
  // Create categorical colour palettes based on unique values
  // Note that to create numeric schemes we would need to know the max and min values
  const fieldPalettes: PhylocanvasLegends = {};
  fieldInformation
    .filter((fi) => fi.canVisualise)
    .forEach((fi) => {
      const values = fieldUniqueValues[fi.columnName]?.filter(val => val !== 'null') ?? [];
      const colours = getColorScheme(colorSchemeSelected, values.length);
      fieldPalettes[fi.columnName] = {};
      values.forEach((val, index) => {
        fieldPalettes[fi.columnName][val] = colours[index];
      });
      if (fieldUniqueValues[fi.columnName]?.includes('null')) {
        fieldPalettes[fi.columnName].null = NULL_COLOUR;
      }
    });

  const result: PhylocanvasMetadata = {};
  for (const sample of dataArray) {
    const sampleName = sample[SAMPLE_ID_FIELD];
    result[sampleName] = {};

    fieldInformation.forEach((fi) => {
      if (fi.columnName === SAMPLE_ID_FIELD) return;

      const value = sample[fi.columnName] ?? 'null';
      const colour = fi.canVisualise ? fieldPalettes[fi.columnName][value] : 'rgba(0,0,0,0)';

      let label: string | undefined;
      if (fi.primitiveType === 'date') {
        label = fi.columnName === 'Date_coll' ? isoDateLocalDateNoTime(value) : isoDateLocalDate(value);
      } else {
        label = value;
      }

      result[sampleName][fi.columnName] = {
        colour,
        label: label ?? '',
      };
    });
  }

  const metadataAndLegends = {
    result,
    legends: fieldPalettes,
  };
  return metadataAndLegends;
}
