import { FeatureLookupFieldType, MapFeatureWithStringProps, MapJson } from '../components/Maps/mapMeta';

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

export function filterGeoJsonByField(
  geoJson: MapJson,
  options: FilterGeoJsonOptions,
): MapJson {
  const { matchValues, lookupField, matchPrefix } = options;

  return {
    ...geoJson,
    features: geoJson.features.filter((f: MapFeatureWithStringProps) => {
      if (!f.properties) return false;
      const fieldValue = f.properties[lookupField];
      
      return matchValues.includes(fieldValue) ||
          (matchPrefix && fieldValue.startsWith(matchPrefix));
    }),
  };
}
