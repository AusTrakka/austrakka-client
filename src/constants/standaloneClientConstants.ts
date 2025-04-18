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
