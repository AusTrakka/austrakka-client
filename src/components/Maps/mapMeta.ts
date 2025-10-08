import { GeoJSON } from 'echarts/types/src/coord/geo/geoTypes';
import MALAYSIA from '../../assets/maps/my_processed.json';
import AUS_NZ from '../../assets/maps/aus_nz_processed.json';
import WORLD from '../../assets/maps/world_map.json';

export const Maps = {
  MALAYSIA: MALAYSIA as GeoJSON,
  AUS_NZ: AUS_NZ as GeoJSON,
  WORLD: WORLD as GeoJSON,
  // 1. Maybe an Australia only map?
  // 2. I don't think New Zealand will need a standalone
  // 3. Need to add a WorldMap [regions will not be hard to support with this one]
  // 4. More to come...
} as const;

// Type that holds the correct values for the keys
export type MapKey = keyof typeof Maps;
export type MapJson = (typeof Maps)[MapKey];
export type MapSupportInfo = [MapKey, boolean];

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

export interface GeoCountRow {
  geoFeature: string;
  count: number;
}

type MapRegistryEntry = {
  key: MapKey;
  supports?: Set<string>; // country keys
};

export const MapRegistry: MapRegistryEntry[] = [
  {
    key: 'MALAYSIA',
    supports: new Set(['MY', 'MYS']),
  },
  {
    key: 'AUS_NZ',
    supports: new Set(['AU', 'NZ', 'AUS', 'NZL']),
  },
  {
    key: 'WORLD', // no supports needed, always included 
  },
];
