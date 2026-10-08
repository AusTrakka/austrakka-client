import {
  type EffectiveMap,
  FeatureLookupField,
  type FeatureLookupFieldType,
  type GeoCountRow,
  MapCategory,
  type MapJson,
  type MapKey,
  MapRegistry,
  type MapSupplement,
  type MapSupportInfo,
} from '../components/Maps/mapMeta';
import type { Field } from '../types/dtos';
import type { Sample } from '../types/sample.interface';

export function detectIsoType(validValues: string[]): FeatureLookupFieldType | null {
  if (!validValues || validValues.length === 0) return null;

  const normalisedValues = validValues.map((value) => value?.trim().toUpperCase()).filter(Boolean);

  const subdivisionValue = normalisedValues.find(isSubdivision);

  if (subdivisionValue) {
    return FeatureLookupField.ISO_REGION;
  }

  const sampleIso = normalisedValues.map(getCountryCode).find((v) => v !== null);

  if (!sampleIso) return null;

  if (/^[A-Z]{3}$/.test(sampleIso)) {
    return FeatureLookupField.ISO_3;
  }

  if (/^[A-Z]{2}$/.test(sampleIso)) {
    return FeatureLookupField.ISO_2;
  }

  return null;
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
      const lookupValue = feature.properties[geoLookupField];

      if (lookupValue) {
        nonGeoLabels[lookupValue] = feature.properties.name;
      }
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
    counts: Object.entries(lookupTable).map(([geoFeature, count]) => ({
      geoFeature,
      count,
    })),
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
  return /^[A-Z]{2}-/.test(code.trim().toUpperCase());
}

export function getGroupedSupportedMaps(supportedMaps: MapSupportInfo[]): {
  solo: MapKey[];
  grouped: MapKey[];
} {
  const solo: MapKey[] = [];
  const grouped: MapKey[] = [];

  for (const [key, hasRegions] of supportedMaps) {
    const entry = MapRegistry.find((e) => e.key === key);

    if (entry?.category === MapCategory.SOLO) {
      if (hasRegions) {
        solo.push(key);
      }
    } else if (entry?.category === MapCategory.GROUPED) {
      grouped.push(key);
    }
  }

  return { solo, grouped };
}

export function isSupplementMap(mapKey: MapKey): boolean {
  return MapRegistry.some((entry) =>
    (entry.supplements ?? []).some((supplement) => supplement.mapKey === mapKey),
  );
}

export function findSupplement(mapKey: MapKey, fieldName: string): MapSupplement | undefined {
  const entry = MapRegistry.find((e) => e.key === mapKey);
  const target = fieldName.toLowerCase();
  return entry?.supplements?.find((s) => s.fieldName.toLowerCase() === target);
}

const allSupplementNames = new Set(
  MapRegistry.flatMap((e) => e.supplements ?? []).map((s) => s.fieldName.toLowerCase()),
);

export function resolveEffectiveMap(
  primaryMap: MapKey,
  fieldName: string,
  validValues: string[],
): EffectiveMap | null {
  const supplement = findSupplement(primaryMap, fieldName);

  if (supplement) {
    return {
      mapKey: supplement.mapKey,
      primaryMapKey: primaryMap,
      lookupField: supplement.lookupField,
    };
  }

  const lookupField = detectIsoType(validValues);

  return lookupField
    ? {
        mapKey: primaryMap,
        primaryMapKey: primaryMap,
        lookupField,
      }
    : null;
}

export function getMapGeoFields(fields: Field[], mapKey: MapKey | null): Field[] {
  const isSupplement = (field: Field) =>
    mapKey !== null && findSupplement(mapKey, field.columnName) !== undefined;

  const valid = fields.filter((field) => {
    if (!field.geoField) return false;
    if (isSupplement(field)) return true;
    if (allSupplementNames.has(field.columnName.toLowerCase())) return false;

    const type = detectIsoType(field.metaDataColumnValidValues ?? []);
    if (type === null) return false;

    return mapKey !== 'WORLD' || type === FeatureLookupField.ISO_3;
  });

  return [...valid].sort((a, b) => Number(isSupplement(a)) - Number(isSupplement(b)));
}
