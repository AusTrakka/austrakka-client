import {
  FeatureLookupField,
  FeatureLookupFieldType,
  GeoCountRow,
  MapFeatureWithStringProps,
  MapJson,
} from '../components/Maps/mapMeta';
import { Sample } from '../types/sample.interface';
import { Field } from '../types/dtos';
import { standardise } from '../app/metadataSliceUtils';

/**
 * @deprecated This needs to be removed
 */
export function parseGeoJson(geoJson: any, propertyName = 'iso_3166_2') {
  const isoList = [];
  for (const feature of geoJson.features) {
    isoList.push(feature.properties[propertyName]);
  }
  return isoList;
}

export interface FilterGeoJsonOptions {
  matchValues: string[],
  lookupField: FeatureLookupFieldType,
  matchPrefix?: string, // this may need to be expanded to a list one day
}

export function detectIsoType(validValues: string[]): FeatureLookupFieldType | null {
  if (!validValues || validValues.length === 0) return null;

  // Take the first non-null standardised value
  const sampleIso = validValues.map(standardise).find(v => v !== null);
  if (!sampleIso) return null;

  if (/^[A-Z]{2}-/.test(validValues[0].toUpperCase())) return 'iso_region';
  if (/^[A-Z]{3}$/.test(sampleIso)) return 'iso_3_char';
  if (/^[A-Z]{2}$/.test(sampleIso)) return 'iso_2_char';

  return null; // fallback
}

// This is wrong as hell brother.
export const aggregateGeoData = (
  rawSamples: Sample[],
  sampleFieldToAgg: Field,
  geoJSON: MapJson,
  geoLookupField: FeatureLookupFieldType,
): GeoCountRow[] => {
  if (!geoJSON) return [];
  if (!rawSamples || rawSamples.length === 0) return [];
  if (geoJSON.features.length === 0) return [];
  
  const lookupTable: Record<string, number> = {};

  // Initialize lookup table with expected values from GeoJSON
  const expectedValues = geoJSON.features.map((feature: any) =>
    feature.properties[geoLookupField]).filter(Boolean) || [];

  expectedValues.forEach((value: string) => {
    lookupTable[value] = 0;
  });

  // Count occurrences of each geographic feature
  rawSamples.forEach((sample) => {
    const geoFeature = sample[sampleFieldToAgg.columnName];
    if (geoFeature && lookupTable[geoFeature] !== undefined) {
      lookupTable[geoFeature] += 1;
    } else if (geoFeature) {
      // eslint-disable-next-line no-console
      console.warn(`Unexpected value ${geoFeature} in filtered data - not found in map`);
    }
  });

  console.log(rawSamples);

  // Convert to array format
  return Object.entries(lookupTable).map(([geoFeature, count]) => ({
    geoFeature,
    count,
  }));
};
