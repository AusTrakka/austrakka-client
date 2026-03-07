import { DropFileUpload } from '../types/DropFileUpload';
import { GroupRole } from '../types/dtos';
import {
  OrgDescriptor,
  SeqPairedUploadRow,
  SeqSingleUploadRow,
  SeqType,
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

export const getSampleNameFromFile = (filename: string) =>
  filename.split(/[_.]+/)[0];

// Remove last .fa only, so that seq2.1.fa becomes seq2.1, not seq2
export const getSampleNameFromFastaCns = (filename: string) =>
  filename.split(/.fa$/)[0];

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

export const getShareableOrgGroups = (orgAbbrev: string, groupRoles: GroupRole[]): string[] => {
  const orgGroupNames: string[] = groupRoles
    // Must match the current org
    .filter((groupRole) => groupRole.group.organisation?.abbreviation === orgAbbrev)
    // Needs to have an Uploader role in the owner group
    .filter(() =>
      groupRoles.some((groupRole) =>
        groupRole.group.organisation?.abbreviation === orgAbbrev &&
        groupRole.role.name === 'Uploader' &&
        groupRole.group.name.split('-').pop() === 'Owner'))
    // Filter out all groups other than Everyone group
    .filter((groupRole) => ['Everyone'].includes(groupRole.group.name.split('-').pop()!))
    .map((groupRole) => groupRole.group.name)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  
  const uniqueOrgGroupNames = [...new Set(orgGroupNames)];
  return uniqueOrgGroupNames;
};

export const createPairedSeqUploadRows = (
  files: DropFileUpload[],
): SeqPairedUploadRow[] => {
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
  const singleFiles = files.map((file) => {
    // For fasta-cns, we've returned the contig name as the whole filename minus .fa suffix.
    // Preserve it. For other data types, we must parse
    const seqId = seqType === SeqType.FastaCns ?
      getSampleNameFromFastaCns(file.file.name) :
      getSampleNameFromFile(file.file.name);
    return {
      id: crypto.randomUUID(),
      seqId,
      file,
      seqType,
      state: SeqUploadRowState.Waiting,
    } as SeqSingleUploadRow;
  });
  return singleFiles;
};

// Split file into lines by contig, by just searching for ">" at the start of a line
// Return a set of files, one per contig, with the contig name as the filename
// The contig name is deemed to be from ">" to the first whitespace
// This function must validate expected properties (e.g. uniqueness of Seq_IDs)
export async function splitFastaByContig(files: File[]) : Promise<File[]> {
  // For now assert only one file, but we could in principle handle many
  if (files.length > 1) {
    throw new Error('Expected only one file for fasta-cns splitting');
  }
  const file = files[0];
  const fileContent = await file.text();
  // Assert that the file starts with ">"; the split asserts that the rest of the contigs do
  if (!fileContent.trim().startsWith('>')) {
    throw new Error('File does not appear to be in fasta format: missing ">" at start of file');
  }
  // Drop first > character from first contig, since it will not be split on.
  // The trim() allows for whitespace after >, although this is technically not valid fasta
  const contigs = fileContent.substring(1).split('\n>').map(line => line.trim());
  const contigNames = new Set();
  const contigFiles = contigs.map((contig) => {
    const contigName = contig.split(/\s/)[0];
    if (contigNames.has(contigName)) {
      throw new Error(`Duplicate Seq_ID found in upload: ${contigName}.`);
    }
    if (contigName === '') {
      throw new Error('Unable to parse contig names from fasta header, empty contig name found');
    }
    contigNames.add(contigName);
    const contigContent = `>${contig}\n`;
    const contigBlob = new Blob([contigContent], { type: file.type });
    return new File([contigBlob], `${contigName}.fa`, { type: file.type });
  });
  return contigFiles;
}
