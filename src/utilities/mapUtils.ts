import { getCountryCode } from '../app/metadataSliceUtils';
import {
  type FeatureLookupFieldType,
  type GeoCountRow,
  MapCategory,
  type MapJson,
  type MapKey,
  MapRegistry,
  type MapSupportInfo,
} from '../components/Maps/mapMeta';
import type { Field } from '../types/dtos';
import type { Sample } from '../types/sample.interface';

export function detectIsoType(validValues: string[]): FeatureLookupFieldType | null {
  if (!validValues || validValues.length === 0) return null;

  // Take the first non-null standardised value
  const sampleIso = validValues.map(getCountryCode).find((v) => v !== null);
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
  const expectedValues =
    geoJSON.features.map((feature: any) => feature.properties[geoLookupField]).filter(Boolean) ||
    [];

  expectedValues.forEach((value: string) => {
    if (lookupTable[value] !== undefined) {
      throw new Error(`Duplicate geoLookupField value "${value}" found in GeoJSON features`);
    }
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

export function getGroupedSupportedMaps(supportedMaps: MapSupportInfo[]): {
  solo: MapKey[];
  grouped: MapKey[];
} {
  const solo: MapKey[] = [];
  const grouped: MapKey[] = [];

  for (const [key, hasRegions] of supportedMaps) {
    const entry = MapRegistry.find((e) => e.key === key);
    if (entry?.category === MapCategory.SOLO) {
      if (hasRegions) solo.push(key);
    } else {
      grouped.push(key);
    }
  }

  return { solo, grouped };
}

export function getMapGeoFields(fields: Field[], mapKey: MapKey | null): Field[] {
  const geoFields = fields
    .filter((field) => field.geoField)
    .filter((field) => detectIsoType(field.metaDataColumnValidValues ?? []) !== null);

  if (mapKey === 'WORLD') {
    return geoFields.filter(
      (field) => detectIsoType(field.metaDataColumnValidValues ?? []) === 'iso_3_char',
    );
  }

  return geoFields;
}
