import { Project } from '../types/dtos';

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
  projectAnalyses: [],
  created: new Date(),
};

export const localProjectAbbrev = LOCAL_PROJECT.abbreviation;

// Using Altair convention
// Q : quantitative, a continuous real-valued quantity
// O : ordinal, a discrete ordered quantity
// N : nominal, a discrete unordered category
// T : temporal, a time or date value
// G : geojson, a geographic shape
//  need to add one for free-text, i.e. nominal-like but do not allow user to select categorical
// X : free text, non-visualisable except as text

export const typeCodes : Record<string, [string, boolean]> = {
  // Represent (code) => (primitiveType, canVisualise)
  'N': ['string', true],
  'X': ['string', false],
  'Q': ['double', true],
  'T': ['date', true],
};
