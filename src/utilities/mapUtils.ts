import {
  FeatureLookupFieldType,
  GeoCountRow,
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

export const aggregateGeoData = (
  rawSamples: Sample[],
  sampleFieldToAgg: Field,
  geoJSON: MapJson,
  geoLookupField: FeatureLookupFieldType,
): { counts: GeoCountRow[]; missing: GeoCountRow[] } => {
  if (!geoJSON) return { counts: [], missing: [] };
  if (!rawSamples || rawSamples.length === 0) return { counts: [], missing: [] };
  if (geoJSON.features.length === 0) return { counts: [], missing: [] };

  const lookupTable: Record<string, number> = {};
  const missingTable: Record<string, number> = {};

  // Initialize lookup table with expected values from GeoJSON
  const expectedValues = geoJSON.features
    .map((feature: any) => feature.properties[geoLookupField])
    .filter(Boolean) || [];

  expectedValues.forEach((value: string) => {
    lookupTable[value] = 0;
  });

  // Count occurrences of each geographic feature
  rawSamples.forEach((sample) => {
    const geoFeature = sample[sampleFieldToAgg.columnName];
    if (geoFeature && lookupTable[geoFeature] !== undefined) {
      lookupTable[geoFeature] += 1;
    } else if (geoFeature) {
      // Track unexpected values separately
      missingTable[geoFeature] = (missingTable[geoFeature] || 0) + 1;
    }
  });

  return {
    counts: Object.entries(lookupTable).map(([geoFeature, count]) => ({
      geoFeature,
      count,
    })),
    missing: Object.entries(missingTable).map(([geoFeature, count]) => ({
      geoFeature,
      count,
    })),
  };
};
