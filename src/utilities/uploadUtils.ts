import Papa from 'papaparse';
import path from 'path-browserify';
import type { DropFileUpload } from '../types/DropFileUpload';
import type { GroupRole } from '../types/dtos';
import {
  type OrgDescriptor,
  type SeqPairedUploadRow,
  type SeqSingleUploadRow,
  SeqType,
  type SeqUploadCsvPair,
  type SeqUploadCsvSingle,
  SeqUploadRowState,
} from '../types/sequploadtypes';

// Uploads are active (queued but not finalised) if in these states
export const activeSeqUploadStates = [
  SeqUploadRowState.Queued,
  SeqUploadRowState.CalculatingHash,
  SeqUploadRowState.CalculatedHash,
  SeqUploadRowState.Uploading,
];

export interface CustomUploadValidatorReturn {
  success: boolean;
  message: string;
}

export interface CustomUploadValidator {
  func: (files: File[], suffixes: string[]) => CustomUploadValidatorReturn;
}

export const validateEvenNumberOfFiles = {
  func: (files: File[], _suffixes: string[]) =>
    ({
      success: files.length % 2 === 0,
      message: 'Must upload an even number of files for paired-end sequence data',
    }) as CustomUploadValidatorReturn,
} as CustomUploadValidator;

export const validateNoDuplicateFilenames = {
  func: (files: File[], _suffixes: string[]) => {
    const filenames = files.map((f) => f.name);
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

function stripSuffix(filename: string, suffixes: string[]) {
  const lowerFilename = filename.toLowerCase();
  const sorted = [...suffixes].sort((a, b) => b.length - a.length);

  for (const suffix of sorted) {
    if (lowerFilename.endsWith(suffix.toLowerCase())) {
      return filename.slice(0, -suffix.length);
    }
  }

  return filename; // no recognized suffix found
}

// strip off any suffix first, then split
export const getSampleNameFromFile = (filename: string, suffixes: string[]) =>
  stripSuffix(filename, suffixes).split(/[_|\s]+/)[0];

// Special handling for artificially created "filenames" for fasta-cns
export const getSampleNameFromFastaCns = (filename: string) => filename.split(/.fa$/)[0];

function countElements(array: any[]): Record<string, number> {
  const count: Record<string, number> = {};
  array.forEach((val) => {
    count[val] = (count[val] || 0) + 1;
  });
  return count;
}

export const validateAllHaveSampleNamesWithTwoFilesOnly = {
  func: (files: File[], suffixes: string[]) => {
    const sampleCounts = countElements(files.map((f) => getSampleNameFromFile(f.name, suffixes)));
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
  func: (files: File[], suffixes: string[]) => {
    const sampleCounts = countElements(files.map((f) => getSampleNameFromFile(f.name, suffixes)));
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
    .filter((groupRole) =>
      ['Owner', 'Contributor'].includes(groupRole.group.name.split('-').pop()!),
    )
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

export interface CsvResult {
  missing: CsvError[];
}

export interface PairedRowsFromCsvResult extends CsvResult {
  rows: SeqPairedUploadRow[];
}

export interface SingleRowsFromCsvResult extends CsvResult {
  rows: SeqSingleUploadRow[];
}

export enum CsvErrorType {
  MISSING = 'MISSING',
  ADDITIONAL = 'ADDITIONAL',
}

export interface CsvError {
  errorType: CsvErrorType;
  sampleName: string | undefined;
  items: string[];
}

export const createSingleSeqUploadRowsFromCsv = (
  files: DropFileUpload[],
  records: SeqUploadCsvSingle[],
  seqType: SeqType,
): SingleRowsFromCsvResult => {
  const filesByName = new Map(files.map((f) => [f.file.name, f]));
  const matchedFileNames = new Set<string>();
  const rows: SeqSingleUploadRow[] = [];
  const errors: CsvError[] = [];

  for (const record of records) {
    const warning: CsvError = {
      sampleName: record.Seq_ID,
      errorType: CsvErrorType.MISSING,
      items: [],
    };

    const read = filesByName.get(record.filepath);

    if (!read) {
      warning.items.push(record.filepath);
    } else {
      matchedFileNames.add(record.filepath);
    }

    if (warning.items.length > 0) {
      errors.push(warning);
      continue;
    }

    rows.push({
      id: crypto.randomUUID(),
      seqId: record.Seq_ID,
      file: read,
      seqType: seqType,
      state: SeqUploadRowState.Waiting,
    } as SeqSingleUploadRow);
  }

  const additionalFiles = files
    .map((f) => f.file.name)
    .filter((name) => !matchedFileNames.has(name));

  if (additionalFiles.length > 0) {
    errors.push({
      sampleName: undefined,
      errorType: CsvErrorType.ADDITIONAL,
      items: additionalFiles,
    });
  }
  return { rows, missing: errors };
};

export const createPairedSeqUploadRowsFromCsv = (
  files: DropFileUpload[],
  pairs: SeqUploadCsvPair[],
): PairedRowsFromCsvResult => {
  const filesByName = new Map(files.map((f) => [f.file.name, f]));
  const matchedFileNames = new Set<string>();
  const rows: SeqPairedUploadRow[] = [];
  const errors: CsvError[] = [];

  for (const pair of pairs) {
    const warning: CsvError = {
      sampleName: pair.Seq_ID,
      errorType: CsvErrorType.MISSING,
      items: [],
    };

    const read1 = filesByName.get(pair.filepath1);
    const read2 = filesByName.get(pair.filepath2);

    if (!read1) {
      warning.items.push(pair.filepath1);
    } else {
      matchedFileNames.add(pair.filepath1);
    }

    if (!read2) {
      warning.items.push(pair.filepath2);
    } else {
      matchedFileNames.add(pair.filepath2);
    }

    if (warning.items.length > 0) {
      errors.push(warning);
      continue;
    }

    rows.push({
      id: crypto.randomUUID(),
      seqId: pair.Seq_ID,
      read1,
      read2,
      seqType: SeqType.FastqIllPe,
      state: SeqUploadRowState.Waiting,
    } as SeqPairedUploadRow);
  }

  const additionalFiles = files
    .map((f) => f.file.name)
    .filter((name) => !matchedFileNames.has(name));

  if (additionalFiles.length > 0) {
    errors.push({
      sampleName: undefined,
      errorType: CsvErrorType.ADDITIONAL,
      items: additionalFiles,
    });
  }
  return { rows, missing: errors };
};

export const createPairedSeqUploadRows = (
  files: DropFileUpload[],
  suffixes: string[],
  pairs?: SeqUploadCsvPair[],
): SeqPairedUploadRow[] => {
  // If we already have a CSV
  if (pairs && pairs.length > 0) {
  }

  const pairedFiles = files
    .sort((a, b) => {
      if (a.file.name < b.file.name) {
        return -1;
      }
      return 1;
    })
    .reduce(
      (
        result: SeqPairedUploadRow[],
        value: DropFileUpload,
        index: number,
        array: DropFileUpload[],
      ) => {
        if (index % 2 === 0) {
          result.push({
            id: crypto.randomUUID(),
            seqId: getSampleNameFromFile(value.file.name, suffixes),
            read1: value,
            read2: array[index + 1],
            seqType: SeqType.FastqIllPe,
            state: SeqUploadRowState.Waiting,
          } as SeqPairedUploadRow);
        }
        return result;
      },
      [],
    );
  return pairedFiles;
};

export const createSingleSeqUploadRows = (
  files: DropFileUpload[],
  seqType: SeqType,
  suffixes: string[],
): SeqSingleUploadRow[] => {
  const singleFiles = files.map((file) => {
    // For fasta-cns, we've returned the contig name as the whole filename minus .fa suffix.
    // Preserve it. For other data types, we must parse
    const seqId =
      seqType === SeqType.FastaCns
        ? getSampleNameFromFastaCns(file.file.name)
        : getSampleNameFromFile(file.file.name, suffixes);
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
export async function splitFastaByContig(files: File[]): Promise<File[]> {
  const contigNames = new Set();
  const contigFiles: File[] = [];
  for (const file of files) {
    const fileContent = await file.text();
    // Assert that the file starts with ">"; the split asserts that the rest of the contigs do
    if (!fileContent.trim().startsWith('>')) {
      throw new Error('File does not appear to be in fasta format: missing ">" at start of file');
    }
    // Drop first > character from first contig, since it will not be split on.
    // The trim() allows for whitespace after >, although this is technically not valid fasta
    const contigs = fileContent
      .substring(1)
      .split('\n>')
      .map((line) => line.trim());
    for (const contig of contigs) {
      const [contigName] = contig.split(/[\s|]/);
      if (contigNames.has(contigName)) {
        const [fastaHeader] = contig.split(/\s/);
        let errorMsg = `Duplicate Seq_ID found in upload: ${contigName}.`;
        if (contigName !== fastaHeader) {
          errorMsg += ` Original FASTA header was ${fastaHeader}.`;
        }
        throw new Error(errorMsg);
      }
      if (contigName === '') {
        throw new Error('Unable to parse contig names from fasta header, empty contig name found');
      }
      contigNames.add(contigName);
      const contigContent = `>${contig}\n`;
      const contigBlob = new Blob([contigContent], { type: file.type });
      contigFiles.push(new File([contigBlob], `${contigName}.fa`, { type: file.type }));
    }
  }
  return contigFiles;
}

export const checkFilename = (input: string): boolean => {
  const invalidChars = /[/\\&|;:><"'?!*]/;
  return !invalidChars.test(input);
};

export const sanitizeFilename = (input: string): string => {
  return input.trimEnd();
};

export const sanitizeFileDescription = (input: string): string => {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: conflicting rules
  return input.replace(/[\u0000-\u001F]/g, '');
};

export const parseFileNameFromPath = (filepath: string) => {
  const location = path.parse(filepath);
  if (location.dir !== '') {
    return location.base;
  }
  return filepath;
};

export const parseSeqUploadCsvSingles = async (pairingFile: File) => {
  const fileContent = await pairingFile.text();

  if (!fileContent || fileContent.length < 1) {
    throw new Error('Pairing file content is invalid');
  }

  const parseConfig: Papa.ParseConfig<SeqUploadCsvSingle> = {
    header: true,
    skipEmptyLines: 'greedy',
    transform: (value, field) => {
      switch (field) {
        case 'filepath':
          // We want to ensure we only grab the filename, not the path
          return parseFileNameFromPath(value).trim();
        case 'Seq_ID':
          return value.trim();
        default:
          return value;
      }
    },
  };

  const parsed = Papa.parse<SeqUploadCsvSingle>(fileContent, parseConfig).data;

  parsed.forEach((row) => {
    if (!row.Seq_ID || row.Seq_ID.trim() === '') {
      throw new Error('Invalid Seq_ID');
    }
    if (!row.filepath || row.filepath.trim() === '') {
      throw new Error('Unable to parse filepath');
    }
  });

  return parsed;
};

export const parseSeqUploadCsvPairs = async (pairingFile: File) => {
  const fileContent = await pairingFile.text();

  if (!fileContent || fileContent.length < 1) {
    throw new Error('Pairing file content is invalid');
  }

  const parseConfig: Papa.ParseConfig<SeqUploadCsvPair> = {
    header: true,
    skipEmptyLines: 'greedy',
    transform: (value, field) => {
      switch (field) {
        case 'filepath1':
        case 'filepath2':
          // We want to ensure we only grab the filename, not the path
          return parseFileNameFromPath(value).trim();
        case 'Seq_ID':
          return value.trim();
        default:
          return value;
      }
    },
  };

  const parsed = Papa.parse<SeqUploadCsvPair>(fileContent, parseConfig).data;

  parsed.forEach((row) => {
    if (!row.Seq_ID || row.Seq_ID.trim() === '') {
      throw new Error('Invalid Seq_ID');
    }
    if (!row.filepath1 || row.filepath1.trim() === '') {
      throw new Error('Unable to parse filepath 1');
    }
    if (!row.filepath2 || row.filepath2.trim() === '') {
      throw new Error('Unable to parse filepath 2');
    }
  });

  return parsed;
};
