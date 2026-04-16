import type { Project } from '../types/dtos';

// This currently mimics the back-end Project DTO, but some info is redundant
export const LOCAL_PROJECT: Project = {
  projectId: 1,
  globalId: 'project-id',
  abbreviation: 'local',
  name: 'Local',
  description: 'Local data',
  type: 'Local',
  projectMembers: {
    id: 1,
    name: 'Local-Group',
  },
  clientType: 'local',
  mergeAlgorithm: 'override',
  trees: [],
  isActive: true,
  created: new Date(),
};

export const localProjectAbbrev = LOCAL_PROJECT.abbreviation;

// Default a field to categorical if it has equal or fewer unique values
export const UNIQUE_VALUE_THRESHOLD = 100;

// Using Altair convention
// Q : quantitative, a continuous real-valued quantity
// O : ordinal, a discrete ordered quantity
// N : nominal, a discrete unordered category
// T : temporal, a time or date value
// G : geojson, a geographic shape (for us currently used for geo ISO codes, i.e. mappable categorical fields)
//  need to add one for free-text, i.e. nominal-like but do not allow user to select categorical
// X : free text, non-visualisable except as text

// gives typeCode: (primitiveType, canVisualise, geoField, displayedFieldType)
export const typeCodes: Record<string, [string, boolean, boolean, string]> = {
  N: ['string', true, false, 'Categorical'],
  X: ['string', false, false, 'Free text'],
  Q: ['double', true, false, 'Numeric'],
  T: ['date', true, false, 'Date'],
  G: ['string', true, true, 'Geo region (ISO)'],
};

// gives displayedFieldType: (primitiveType, canVisualise, geoField)
export const typesByName: Record<string, [string, boolean, boolean, string]> = Object.entries(typeCodes).reduce(
  (acc, [typeCode, [primitiveType, canVisualise, geoField, typeName]]) => {
    acc[typeName] = [primitiveType, canVisualise, geoField, typeCode];
    return acc;
  },
  {} as Record<string, [string, boolean, boolean, string]>,
);
