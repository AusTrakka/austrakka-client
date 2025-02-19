import { DropFileUpload } from '../types/DropFileUpload';
import { GroupRole } from '../types/dtos';
import { ResponseObject } from '../types/responseObject.interface';
import { uploadSubmissions, validateSubmissions } from './resourceUtils';
import { ResponseType } from '../constants/responseType';

interface SeqPair {
  file: File
  sampleName: string
}
export enum SeqUploadRowState {
  Waiting = 'Waiting',
  Queued = 'Queued',
  CalculatingHash = 'Calculating Hash',
  CalculatedHash = 'Calculated Hash',
  Uploading = 'Uploading',
  Complete = 'Complete',
  Skipped = 'Skipped', // TODO use if skipped
  Errored = 'Errored',
}

// Uploads are active (queued, but not finalised) if in these states
export const activeSeqUploadStates = [
  SeqUploadRowState.Queued,
  SeqUploadRowState.CalculatingHash,
  SeqUploadRowState.CalculatedHash,
  SeqUploadRowState.Uploading,
];

// We cannot use the color prop as it will only let us set primary,error,success etc
// For some of these states that would be fine, but since it won't work for all,
// set them all with styles here
export const seqStateStyles = {
  [SeqUploadRowState.Waiting]: {
    color: 'black',
    backgroundColor: 'white',
    borderColor: import.meta.env.VITE_THEME_SECONDARY_DARK_GREY,
    border: '1px solid',
  },
  [SeqUploadRowState.Queued]: {
    color: 'black',
    backgroundColor: import.meta.env.VITE_THEME_SECONDARY_LIGHT_GREY,
  },
  [SeqUploadRowState.CalculatingHash]: {
    color: 'white',
    backgroundColor: import.meta.env.VITE_THEME_SECONDARY_BLUE,
  },
  [SeqUploadRowState.CalculatedHash]: {
    color: 'white',
    backgroundColor: import.meta.env.VITE_THEME_SECONDARY_BLUE,
  },
  [SeqUploadRowState.Uploading]: {
    color: 'white',
    backgroundColor: import.meta.env.VITE_THEME_SECONDARY_BLUE,
  },
  [SeqUploadRowState.Complete]: {
    color: 'white',
    backgroundColor: import.meta.env.VITE_THEME_SECONDARY_LIGHT_GREEN,
  },
  [SeqUploadRowState.Skipped]: {
    color: 'black',
    backgroundColor: import.meta.env.VITE_THEME_SECONDARY_YELLOW,
  },
  [SeqUploadRowState.Errored]: {
    color: 'white',
    backgroundColor: import.meta.env.VITE_THEME_SECONDARY_RED,
  },
};

export interface SeqUploadRow {
  id: string
  seqId: string
  read1: DropFileUpload
  read2: DropFileUpload
  state: SeqUploadRowState
}

export enum SeqType {
  FastqIllPe = 'fastq-ill-pe',
  // FastqIllSe = 'fastq-ill-se',
  // FastqOnt = 'fastq-ont',
}

export const seqTypeNames = {
  [SeqType.FastqIllPe]: 'Illumina Paired-End FASTQ',
};

export enum SkipForce {
  None = '',
  Skip = 'skip',
  Force = 'overwrite',
}

export interface CustomUploadValidatorReturn {
  success: boolean,
  message: string,
}

export interface CustomUploadValidator {
  func: (files: File[]) => CustomUploadValidatorReturn,
}

export const validateEvenNumberOfFiles = {
  func: (files: File[]) => ({
    success: files.length % 2 === 0,
    message: 'Must upload an even number of files',
  } as CustomUploadValidatorReturn),
} as CustomUploadValidator;

export const validateNoDuplicateFilenames = {
  func: (files: File[]) => {
    const filenames = files.map(f => f.name);
    const duplicates = filenames.filter((item, index) => filenames.indexOf(item) !== index);
    if (duplicates.length > 0) {
      return {
        success: false,
        message: `The following files appear more than once: ${duplicates.join(', ')}`,
      } as CustomUploadValidatorReturn;
    }
    return {
      success: true,
      message: '',
    } as CustomUploadValidatorReturn;
  },
} as CustomUploadValidator;

export const getSampleNameFromFile = (filename: string) => filename.split('_')[0];

export const validateAllHaveSampleNamesWithTwoFilesOnly = {
  func: (files: File[]) => {
    const filenames: SeqPair[] = files
      .map(f => ({ file: f, sampleName: getSampleNameFromFile(f.name) } as SeqPair));
    // @ts-ignore
    const groupedFilenames = filenames
      .reduce((f, u) => (
        { ...f, [u.sampleName]: [...(f[u.sampleName as keyof typeof f] || []), u] }
      ), {});
    // @ts-ignore
    const problemSampleNames = Object.entries(groupedFilenames)
      // @ts-ignore
      .filter((k) => k[1].length !== 2)
      .map((k) => k[0]);
    if (problemSampleNames.length > 0) {
      return {
        success: false,
        message: `Unable to parse file pairs for the following samples: ${problemSampleNames.join(', ')}`,
      } as CustomUploadValidatorReturn;
    }
    return {
      success: true,
    } as CustomUploadValidatorReturn;
  },
} as CustomUploadValidator;

export interface OrgDescriptor {
  abbreviation: string,
  name: string,
}

// Logic of these two functions will need to change in perms V2; currently take in groupRoles

// TODO requires special logic if we want admins to be allowed to upload to any org using this UI 
//  but do we? They can always give themselves a role if they really need to use the UI

// TODO ought to get group type in DTO rather than rely on group name structure - 
// however this is temporary anyway
export const getUploadableOrgs = (groupRoles: GroupRole[]): OrgDescriptor[] => {
  const orgs: OrgDescriptor[] = groupRoles
    .filter((groupRole) => groupRole.role.name === 'Uploader')
    .filter((groupRole) => ['Owner', 'Contributor'].includes(groupRole.group.name.split('-').pop()!))
    .map((groupRole) => groupRole.group.organisation);
  return orgs;
};

export const getSharableProjects = (groupRoles: GroupRole[]): string[] => {
  const projectAbbrevs: string[] = groupRoles
    .filter((groupRole) => groupRole.role.name === 'Uploader')
    .filter((groupRole) => groupRole.group.name.split('-').pop()! === 'Group')
    .map((groupRole) => groupRole.group.name.split('-').slice(0, -1).join('-'));
  return projectAbbrevs;
};

export const createAndShareSamples = async (
  dataOwnerAbbrev: string,
  shareProjectAbbrevs: string[],
  seqUploadRows: SeqUploadRow[],
  token: string,
): Promise<ResponseObject> => {
  // construct CSV file out of seqUploadRows
  const projectGroups = shareProjectAbbrevs.map(abbrev => `${abbrev}-Group`);
  const csvHeader = 'Seq_ID,Owner_group,Shared_groups';
  const csvRows = seqUploadRows.map(row => `${row.seqId},${dataOwnerAbbrev}-Owner,${projectGroups.join(';')}`);
  const csv = [csvHeader, ...csvRows].join('\n');
  const csvFile = new File([csv], 'samples_from_seq_submission.csv', { type: 'text/csv' });
  
  const formData = new FormData();
  formData.append('file', csvFile);
  formData.append('proforma-abbrev', 'min');

  // Validate and go no further if error
  // TODO if we get a warning from validation, consider getting user confirmation
  let response = await validateSubmissions(formData, '', token);
  if (response.status === ResponseType.Error) return response;
  
  response = await uploadSubmissions(formData, '', token);
  return response;
};
