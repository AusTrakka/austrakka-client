import { GeoJSON } from 'echarts/types/src/coord/geo/geoTypes';
import MALAYSIA from '../../assets/maps/malaysia.json';
import AUS_NZ from '../../assets/maps/au_nz_processed.json';

export const Maps = {
  MALAYSIA: MALAYSIA as GeoJSON,
  AUS_NZ: AUS_NZ as GeoJSON,
} as const;

// Type that holds the correct values for the keys
export type MapKey = keyof typeof Maps;
export type MapJson = (typeof Maps)[MapKey];

export type MapFeatureWithStringProps = {
  properties: { [x: string]: string }
};

export const FeatureLookupField = {
  ISO_2: 'iso_2_char',
  ISO_3: 'iso_3_char',
  ISO_REGION: 'iso_region',
  NAME: 'name',
} as const;

export type FeatureLookupFieldType = typeof FeatureLookupField[keyof typeof FeatureLookupField];
