/* eslint-disable no-plusplus */
import { FieldAndColourScheme, PhylocanvasLegends, PhylocanvasMetadata } from '../types/phylocanvas.interface';
import { Field } from '../types/dtos';
import { createColourMapping } from './colourUtils';
import { Sample } from '../types/sample.interface';
import { SAMPLE_ID_FIELD } from '../constants/metadataConsts';
import { defaultDiscreteColorScheme } from '../constants/schemes';
import { renderValue } from './renderUtils';

export default function mapMetadataToPhylocanvas(
  dataArray: Sample[],
  fieldInformation: Field[],
  fieldUniqueValues: Record<string, string[] | null>,
  colorSchemeSelected: FieldAndColourScheme,
) {
  // Create categorical colour palettes based on unique values
  // Note that to create numeric schemes we would need to know the max and min values
  // and some fields have a natural min and natural max regardless of data
  const fieldPalettes: PhylocanvasLegends = {};

  fieldInformation
    .filter((fi) => fi.canVisualise)
    .forEach((fi) => {
      fieldPalettes[fi.columnName] = createColourMapping(
        fieldUniqueValues[fi.columnName] ?? [],
        colorSchemeSelected[fi.columnName] ?? defaultDiscreteColorScheme,
      );
    });

  const result: PhylocanvasMetadata = {};
  for (const sample of dataArray) {
    const sampleName = sample[SAMPLE_ID_FIELD];
    result[sampleName] = {};
    fieldInformation.forEach((fi) => {
      const value = sample[fi.columnName] ?? 'null';
      const colour = fi.canVisualise ? fieldPalettes[fi.columnName][value] : 'rgba(0,0,0,0)';
      const label: string | undefined = renderValue(value, fi.columnName, fi.primitiveType!);
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
