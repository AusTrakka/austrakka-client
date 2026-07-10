import type { MergeAlgorithm } from '../../constants/mergeAlgorithm';
import type { Project, ProjectPut } from '../../types/dtos';

export type ProjectDraft = ProjectPut & { isActive: boolean };

export function toProjectDraft(project: Project): ProjectDraft {
  return {
    ...toProjectPut(project),
    isActive: project.isActive,
  };
}

export function toProjectPut(project: Project): ProjectPut {
  return {
    name: project.name,
    description: project.description,
    requestingOrg: project.requestingOrg,
    dashboardName: project.dashboardName,
    label: project.label,
    mergeAlgorithm: project.mergeAlgorithm as MergeAlgorithm,
    clientType: project.clientType,
  };
}

export const readonlyFields: ReadonlyArray<keyof Project> = ['abbreviation'];

export const desiredOrderingOfEditableFields: ReadonlyArray<keyof ProjectDraft> = [
  'name',
  'description',
  'label',
  'dashboardName',
  'mergeAlgorithm',
  'requestingOrg',
  'isActive',
];

export const readableNames: Record<string, string> = {
  abbreviation: 'Abbreviation',
  created: 'Created',
  createdBy: 'Created By',
  lastUpdated: 'Last Updated',
  lastUpdatedBy: 'Last Updated By',
  name: 'Name',
  description: 'Description',
  label: 'Label',
  requestingOrg: 'Requesting Organisation',
  dashboardName: 'Dashboard Name',
  mergeAlgorithm: 'Merge Algorithm',
  isActive: 'Active',
};
