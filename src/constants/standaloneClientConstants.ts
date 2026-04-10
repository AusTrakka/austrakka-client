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
// G : geojson, a geographic shape
//  need to add one for free-text, i.e. nominal-like but do not allow user to select categorical
// X : free text, non-visualisable except as text

// gives typeCode: (primitiveType, canVisualise, displayedFieldType)
export const typeCodes: Record<string, [string, boolean, string]> = {
  N: ['string', true, 'Categorical'],
  X: ['string', false, 'Free text'],
  Q: ['double', true, 'Numeric'],
  T: ['date', true, 'Date'],
};

// gives displayedFieldType: (primitiveType, canVisualise)
export const typesByName: Record<string, [string, boolean]> = Object.entries(typeCodes).reduce(
  (acc, [_typeCode, [primitiveType, canVisualise, typeName]]) => {
    acc[typeName] = [primitiveType, canVisualise];
    return acc;
  },
  {} as Record<string, [string, boolean]>,
);
