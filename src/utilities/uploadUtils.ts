import { DropFileUpload } from '../types/DropFileUpload';

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
    backgroundColor: import.meta.env.VITE_THEME_SECONDARY_TEAL,
  },
  [SeqUploadRowState.Uploading]: {
    color: 'white',
    backgroundColor: import.meta.env.VITE_THEME_SECONDARY_DARK_GREEN,
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

// TODO: fix typescript issues here
export const validateAllHaveSampleNamesWithTwoFilesOnly = {
  func: (files: File[]) => {
    const filenames = files
      .map(f => ({ file: f, sampleName: getSampleNameFromFile(f.name) } as SeqPair));
    // @ts-ignore
    const groupedFilenames = filenames
      .reduce((ubc, u) => ({ ...ubc, [u.sampleName]: [...(ubc[u.sampleName] || []), u] }), {});
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