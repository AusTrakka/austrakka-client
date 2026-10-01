import type { FeatureCollection } from 'geojson';
import AU_LGA from '../../assets/maps/aus_lga_processed.json';
import AUS_NZ from '../../assets/maps/aus_nz_processed.json';
import AU_POA from '../../assets/maps/aus_poa_processed.json';
import MALAYSIA from '../../assets/maps/my_processed.json';
import NEW_CALEDONIA from '../../assets/maps/nc-processed.json';
import PAPUA_NEW_GUINEA from '../../assets/maps/png-processed.json';
import WORLD from '../../assets/maps/world_map.json';

export const Maps = {
  MALAYSIA: MALAYSIA as FeatureCollection,
  AUS_NZ: AUS_NZ as FeatureCollection,
  WORLD: WORLD as FeatureCollection,
  PAPUA_NEW_GUINEA: PAPUA_NEW_GUINEA as FeatureCollection,
  NEW_CALEDONIA: NEW_CALEDONIA as FeatureCollection,
  AU_LGA: AU_LGA as FeatureCollection,
  AU_POA: AU_POA as FeatureCollection,
};

export const MapLabels: Record<MapKey, string> = {
  MALAYSIA: 'Malaysia',
  AUS_NZ: 'Australia & New Zealand',
  WORLD: 'World',
  PAPUA_NEW_GUINEA: 'Papua New Guinea',
  NEW_CALEDONIA: 'New Caledonia',
  AU_LGA: 'Australia (LGA)',
  AU_POA: 'Australia (Postcode)',
};

export const MapGroups: Partial<Record<MapKey, MapKey>> = {
  AU_LGA: 'AUS_NZ',
  AU_POA: 'AUS_NZ',
};

export const MapFieldOverrides: Record<string, MapKey> = {
  LGA: 'AU_LGA',
  Postcode: 'AU_POA',
};

export type MapKey = keyof typeof Maps;
export type MapJson = (typeof Maps)[MapKey];
export type MapSupportInfo = [MapKey, boolean];

export type MapFeatureWithStringProps = {
  properties: { [x: string]: string };
};

export interface EffectiveMap {
  mapKey: MapKey;
  lookupField: FeatureLookupFieldType;
}

export const FeatureLookupField = {
  ISO_2: 'iso_2_char',
  ISO_3: 'iso_3_char',
  ISO_REGION: 'iso_region',
  NAME: 'name',
  POA_CODE: 'poa_code',
} as const;

export type FeatureLookupFieldType = (typeof FeatureLookupField)[keyof typeof FeatureLookupField];

export interface GeoCountRow {
  geoFeature: string;
  count: number;
}

type MapRegistryEntry = {
  key: MapKey;
  supports?: Set<string>;
};

export const MapRegistry: MapRegistryEntry[] = [
  { key: 'MALAYSIA', supports: new Set(['MY', 'MYS']) },
  { key: 'PAPUA_NEW_GUINEA', supports: new Set(['PG', 'PNG']) },
  { key: 'NEW_CALEDONIA', supports: new Set(['NC', 'NCL']) },
  { key: 'AUS_NZ', supports: new Set(['AU', 'NZ', 'AUS', 'NZL']) },
  { key: 'AU_LGA', supports: new Set(['AU', 'AUS']) },
  { key: 'AU_POA', supports: new Set(['AU', 'AUS']) },
  { key: 'WORLD' },
];
