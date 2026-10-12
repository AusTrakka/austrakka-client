import type { FeatureCollection } from 'geojson';
import AU_LGA from '../../assets/maps/aus_lga_processed.json';
import AU_POA from '../../assets/maps/aus_poa_processed.json';
import AUS_NZ from '../../assets/maps/aus-nz-processed.json';
import AUSTRALIA from '../../assets/maps/aus-processed.json';
import BANGLADESH from '../../assets/maps/bd-processed.json';
import SRI_LANKA from '../../assets/maps/lk-processed.json';
import MALAYSIA from '../../assets/maps/my_processed.json';
import NEW_CALEDONIA from '../../assets/maps/nc-processed.json';
import NZ from '../../assets/maps/nz-processed.json';
import PHILIPPINES from '../../assets/maps/ph-processed.json';
import PAPUA_NEW_GUINEA from '../../assets/maps/png-processed.json';
import TAIWAN from '../../assets/maps/tw-processed.json';
import VIETNAM from '../../assets/maps/vn-processed.json';
import WORLD from '../../assets/maps/world_map.json';

export const Maps = {
  MALAYSIA: MALAYSIA as FeatureCollection,
  AUS_NZ: AUS_NZ as FeatureCollection,
  WORLD: WORLD as FeatureCollection,
  PAPUA_NEW_GUINEA: PAPUA_NEW_GUINEA as FeatureCollection,
  NEW_CALEDONIA: NEW_CALEDONIA as FeatureCollection,
  NZ: NZ as FeatureCollection,
  AUSTRALIA: AUSTRALIA as FeatureCollection,
  SRI_LANKA: SRI_LANKA as FeatureCollection,
  PHILIPPINES: PHILIPPINES as FeatureCollection,
  VIETNAM: VIETNAM as FeatureCollection,
  BANGLADESH: BANGLADESH as FeatureCollection,
  TAIWAN: TAIWAN as FeatureCollection,

  // Supplement maps. These are implementation maps and are not user-selectable.
  AU_LGA: AU_LGA as FeatureCollection,
  AU_POA: AU_POA as FeatureCollection,
};

export const MapLabels: Record<MapKey, string> = {
  MALAYSIA: 'Malaysia',
  AUS_NZ: 'Australia & New Zealand',
  WORLD: 'World',
  PAPUA_NEW_GUINEA: 'Papua New Guinea',
  NEW_CALEDONIA: 'New Caledonia',
  NZ: 'New Zealand',
  AUSTRALIA: 'Australia',
  SRI_LANKA: 'Sri Lanka',
  PHILIPPINES: 'Philippines',
  VIETNAM: 'Vietnam',
  BANGLADESH: 'Bangladesh',
  TAIWAN: 'Taiwan',

  // Internal labels. These should never be rendered in the map selector.
  AU_LGA: 'Australia (LGA)',
  AU_POA: 'Australia (Postcode)',
};

export const MapCategory = {
  SOLO: 'solo',
  GROUPED: 'grouped',
} as const;

export type MapCategoryType = (typeof MapCategory)[keyof typeof MapCategory];

export type MapKey = keyof typeof Maps;
export type MapJson = (typeof Maps)[MapKey];
export type MapSupportInfo = [MapKey, boolean];

export interface EffectiveMap {
  mapKey: MapKey;
  primaryMapKey: MapKey;
  lookupField: FeatureLookupFieldType;
}

export type MapFeatureWithStringProps = {
  properties: { [x: string]: string };
};

export const FeatureLookupField = {
  ISO_2: 'iso_2_char',
  ISO_3: 'iso_3_char',
  ISO_REGION: 'iso_region',
  LGA_NAME: 'lga_name',
  POA_CODE: 'poa_code',
} as const;

export const DEFAULT_TOOLTIP_PROPERTY = 'name';

export const MapTooltipProperty: Partial<Record<MapKey, string>> = {
  AU_LGA: 'state',
};

export type FeatureLookupFieldType = (typeof FeatureLookupField)[keyof typeof FeatureLookupField];

export interface GeoCountRow {
  geoFeature: string;
  count: number;
}

export interface MapSupplement {
  mapKey: MapKey;
  fieldName: string;
  lookupField: FeatureLookupFieldType;
}

type MapRegistryEntry = {
  key: MapKey;
  category: MapCategoryType;
  supports?: Set<string>;
  supplements?: MapSupplement[];
};

const AU_SUPPLEMENTS: MapSupplement[] = [
  { mapKey: 'AU_LGA', fieldName: 'LGA', lookupField: FeatureLookupField.LGA_NAME },
  { mapKey: 'AU_POA', fieldName: 'Postcode', lookupField: FeatureLookupField.POA_CODE },
];

export const MapRegistry: MapRegistryEntry[] = [
  {
    key: 'MALAYSIA',
    category: MapCategory.SOLO,
    supports: new Set(['MY', 'MYS']),
  },
  {
    key: 'PAPUA_NEW_GUINEA',
    category: MapCategory.SOLO,
    supports: new Set(['PG', 'PNG']),
  },
  {
    key: 'NEW_CALEDONIA',
    category: MapCategory.SOLO,
    supports: new Set(['NC', 'NCL']),
  },
  {
    key: 'AUS_NZ',
    category: MapCategory.GROUPED,
    supports: new Set(['AU', 'NZ', 'AUS', 'NZL']),
    supplements: AU_SUPPLEMENTS,
  },
  {
    key: 'PHILIPPINES',
    category: MapCategory.SOLO,
    supports: new Set(['PH', 'PHL']),
  },
  {
    key: 'VIETNAM',
    category: MapCategory.SOLO,
    supports: new Set(['VN', 'VNM']),
  },
  {
    key: 'AUSTRALIA',
    category: MapCategory.SOLO,
    supports: new Set(['AU', 'AUS']),
    supplements: AU_SUPPLEMENTS,
  },
  {
    key: 'NZ',
    category: MapCategory.SOLO,
    supports: new Set(['NZ', 'NZL']),
  },
  {
    key: 'SRI_LANKA',
    category: MapCategory.SOLO,
    supports: new Set(['LK', 'LKA']),
  },
  {
    key: 'BANGLADESH',
    category: MapCategory.SOLO,
    supports: new Set(['BD', 'BGD']),
  },
  {
    key: 'TAIWAN',
    category: MapCategory.SOLO,
    supports: new Set(['TW', 'TWN']),
  },
  {
    key: 'WORLD',
    category: MapCategory.GROUPED,
  },
];
