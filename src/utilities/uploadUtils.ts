import { DropFileUpload } from '../types/DropFileUpload';
import { GroupRole } from '../types/dtos';
import {
  OrgDescriptor,
  SeqPairedUploadRow,
  SeqSingleUploadRow,
  SeqType,
  SeqUploadRow,
  SeqUploadRowState,
} from '../types/sequploadtypes';

// Uploads are active (queued, but not finalised) if in these states
export const activeSeqUploadStates = [
  SeqUploadRowState.Queued,
  SeqUploadRowState.CalculatingHash,
  SeqUploadRowState.CalculatedHash,
  SeqUploadRowState.Uploading,
];

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
    message: 'Must upload an even number of files for paired-end sequence data',
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

function countElements(array: any[]): Record<string, number> {
  const count: Record<string, number> = {};
  array.forEach((val) => {
    count[val] = (count[val] || 0) + 1;
  });
  return count;
}

export const validateAllHaveSampleNamesWithTwoFilesOnly = {
  func: (files: File[]) => {
    const sampleCounts = countElements(files.map(f => getSampleNameFromFile(f.name)));
    const problemSampleNames = Object.entries(sampleCounts)
      .filter(([_sample, count]) => count !== 2)
      .map(([sample, _count]) => sample);
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

export const validateAllHaveSampleNamesWithOneFileOnly = {
  func: (files: File[]) => {
    const sampleCounts = countElements(files.map(f => getSampleNameFromFile(f.name)));
    const problemSampleNames = Object.entries(sampleCounts)
      .filter(([_sample, count]) => count !== 1)
      .map(([sample, _count]) => sample);
    if (problemSampleNames.length > 0) {
      return {
        success: false,
        message: `Found too many files for the following samples: ${problemSampleNames.join(', ')}`,
      } as CustomUploadValidatorReturn;
    }
    return {
      success: true,
    } as CustomUploadValidatorReturn;
  },
} as CustomUploadValidator;

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

export const createSampleCSV = (
  seqUploadRows: SeqUploadRow[],
): string => {
  // This is technically a CSV, but has just a single column
  const csvHeader = 'Seq_ID';
  const csvRows = seqUploadRows.map(
    row => `${row.seqId}}`,
  );
  const csv = [csvHeader, ...csvRows].join('\n');
  return csv;
};

export const createPairedSeqUploadRows = (
  files: DropFileUpload[],
  seqType: SeqType,
): SeqPairedUploadRow[] => {
  if (seqType !== SeqType.FastqIllPe) {
    throw new Error('Invalid seqType for creating paired-end sequence upload rows');
  }
  const pairedFiles = files.sort((a, b) => {
    if (a.file.name < b.file.name) {
      return -1;
    }
    return 1;
  })
    .reduce((
      result: SeqPairedUploadRow[],
      value: DropFileUpload,
      index: number,
      array: DropFileUpload[],
    ) => {
      if (index % 2 === 0) {
        result.push({
          id: crypto.randomUUID(),
          seqId: getSampleNameFromFile(value.file.name),
          read1: value,
          read2: array[index + 1],
          seqType: SeqType.FastqIllPe,
          state: SeqUploadRowState.Waiting,
        } as SeqPairedUploadRow);
      }
      return result;
    }, []);
  return pairedFiles;
};

export const createSingleSeqUploadRows = (
  files: DropFileUpload[],
  seqType: SeqType,
): SeqSingleUploadRow[] => {
  if (![SeqType.FastqIllSe, SeqType.FastqOnt].includes(seqType)) {
    throw new Error('Invalid seqType for creating single-end sequence upload rows');
  }
  const singleFiles = files.map((file) => ({
    id: crypto.randomUUID(),
    seqId: getSampleNameFromFile(file.file.name),
    file,
    seqType,
    state: SeqUploadRowState.Waiting,
  } as SeqSingleUploadRow));
  return singleFiles;
};
