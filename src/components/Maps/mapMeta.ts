import type { FeatureCollection } from 'geojson';
import AUS_NZ from '../../assets/maps/aus_nz_processed.json';
import MALAYSIA from '../../assets/maps/my_processed.json';
import NEW_CALEDONIA from '../../assets/maps/nc-processed.json';
import PAPUA_NEW_GUINEA from '../../assets/maps/png-processed.json';
import WORLD from '../../assets/maps/world_map.json';
import PHILIPPINES from '../../assets/maps/ph-processed.json';
import VIETNAM from '../../assets/maps/vn-processed.json'

export const Maps = {
  MALAYSIA: MALAYSIA as FeatureCollection,
  AUS_NZ: AUS_NZ as FeatureCollection,
  WORLD: WORLD as FeatureCollection,
  PAPUA_NEW_GUINEA: PAPUA_NEW_GUINEA as FeatureCollection,
  NEW_CALEDONIA: NEW_CALEDONIA as FeatureCollection,
  PHILIPPINES: PHILIPPINES as FeatureCollection,
  VIETNAM: VIETNAM as FeatureCollection,
};

export const MapLabels: Record<MapKey, string> = {
  MALAYSIA: 'Malaysia',
  AUS_NZ: 'Australia & New Zealand',
  WORLD: 'World',
  PAPUA_NEW_GUINEA: 'Papua New Guinea',
  NEW_CALEDONIA: 'New Caledonia',
  PHILIPPINES: 'Philippines',
  VIETNAM: 'Vietnam',
};

// Type that holds the correct values for the keys
export type MapKey = keyof typeof Maps;
export type MapJson = (typeof Maps)[MapKey];
export type MapSupportInfo = [MapKey, boolean];

export type MapFeatureWithStringProps = {
  properties: { [x: string]: string };
};

export const FeatureLookupField = {
  ISO_2: 'iso_2_char',
  ISO_3: 'iso_3_char',
  ISO_REGION: 'iso_region',
  NAME: 'name',
} as const;

export type FeatureLookupFieldType = (typeof FeatureLookupField)[keyof typeof FeatureLookupField];

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
    key: 'PAPUA_NEW_GUINEA',
    supports: new Set(['PG', 'PNG']),
  },
  {
    key: 'NEW_CALEDONIA',
    supports: new Set(['NC', 'NCL']),
  },
  {
    key: 'AUS_NZ',
    supports: new Set(['AU', 'NZ', 'AUS', 'NZL']),
  },
  {
    key: 'PHILIPPINES',
    supports: new Set(['PH', 'PHL']),
  },
  {
    key: 'VIETNAM',
    supports: new Set(['VN', 'VNM']),
  },
  {
    key: 'WORLD', // no supports needed, always included
  },
];
