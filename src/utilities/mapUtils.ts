import {
  type EffectiveMap,
  FeatureLookupField,
  type FeatureLookupFieldType,
  type GeoCountRow,
  MapFieldOverrides,
  type MapJson,
  type MapKey,
} from '../components/Maps/mapMeta';
import type { Field } from '../types/dtos';
import type { Sample } from '../types/sample.interface';

export function detectIsoType(validValues: string[]): FeatureLookupFieldType | null {
  if (!validValues || validValues.length === 0) return null;

  const sampleIso = validValues.map(getCountryCode).find((v) => v !== null);
  if (!sampleIso) return null;

  if (/^[A-Z]{2}-/.test(validValues[0].toUpperCase())) return FeatureLookupField.ISO_REGION;
  if (/^[A-Z]{3}$/.test(sampleIso)) return FeatureLookupField.ISO_3;
  if (/^[A-Z]{2}$/.test(sampleIso)) return FeatureLookupField.ISO_2;

  return null;
}

const CHILD_LOOKUP_FIELDS: Partial<Record<MapKey, FeatureLookupFieldType>> = {
  AU_LGA: FeatureLookupField.NAME,
  AU_POA: FeatureLookupField.POA_CODE,
};

export function resolveEffectiveMap(
  primaryMap: MapKey,
  fieldName: string,
  validValues: string[],
): EffectiveMap | null {
  const overrideMapKey = MapFieldOverrides[primaryMap]?.[fieldName];
  if (overrideMapKey) {
    const lookupField = CHILD_LOOKUP_FIELDS[overrideMapKey];
    if (lookupField) return { mapKey: overrideMapKey, lookupField };
  }

  const lookupField = detectIsoType(validValues);
  return lookupField ? { mapKey: primaryMap, lookupField } : null;
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

  const nonGeoLabels: Record<string, string> = {};
  geoJSON.features.forEach((feature: any) => {
    if (feature.properties?.not_geographical) {
      nonGeoLabels[feature.properties[geoLookupField]] = feature.properties.name;
    }
  });

  const expectedValues = geoJSON.features
    .filter((feature: any) => !feature.properties?.not_geographical)
    .map((feature: any) => feature.properties[geoLookupField])
    .filter(Boolean);

  expectedValues.forEach((value: string) => {
    if (lookupTable[value] !== undefined) {
      throw new Error(`Duplicate geoLookupField value "${value}" found in GeoJSON features`);
    }
    lookupTable[value] = 0;
  });

  rawSamples.forEach((sample) => {
    const geoFeature = sample[sampleFieldToAgg.columnName];
    if (geoFeature && lookupTable[geoFeature] !== undefined) {
      lookupTable[geoFeature] += 1;
    } else if (geoFeature) {
      missingTable[geoFeature] = (missingTable[geoFeature] || 0) + 1;
    }
  });

  return {
    counts: Object.entries(lookupTable).map(([geoFeature, count]) => ({ geoFeature, count })),
    missing: Object.entries(missingTable).map(([geoFeature, count]) => ({
      geoFeature: nonGeoLabels[geoFeature] ?? geoFeature,
      count,
    })),
  };
};

export function getCountryCode(code: string): string | null {
  if (!code) return null;
  const upperCaseIso = code.trim().toUpperCase();
  if (/^[A-Z]{2}-/.test(upperCaseIso)) {
    return upperCaseIso.slice(0, 2);
  }
  if (/^[A-Z]{2}$/.test(upperCaseIso)) {
    return upperCaseIso;
  }
  if (/^[A-Z]{3}$/.test(upperCaseIso)) {
    return upperCaseIso;
  }
  return null;
}

export function isSubdivision(code: string): boolean {
  return /^[A-Z]{2}-/.test(code.toUpperCase());
}
