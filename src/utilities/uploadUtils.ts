import Papa from 'papaparse';
import path from 'path-browserify';
import type { UserSliceState } from '../app/userSlice';
import { UploadErrorMessages } from '../components/Upload/Constants/UploadMessages';
import RecordTypes from '../constants/record-type.enum';
import { ScopeDefinitions } from '../constants/scopes';
import type { DropFileUpload } from '../types/DropFileUpload';
import {
  type OrgDescriptor,
  type SeqPairedUploadRow,
  type SeqSingleUploadRow,
  SeqType,
  type SeqUploadCsv,
  type SeqUploadCsvPair,
  type SeqUploadCsvSingle,
  type SeqUploadRow,
  SeqUploadRowState,
} from '../types/sequploadtypes';
import { privsOfTypeWithScope } from './privCheck';

// Uploads are active (queued but not finalised) if in these states
export const activeSeqUploadStates = [
  SeqUploadRowState.Queued,
  SeqUploadRowState.CalculatingHash,
  SeqUploadRowState.CalculatedHash,
  SeqUploadRowState.Uploading,
];

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

export const getUploadableSampleOrgs = (user: UserSliceState): OrgDescriptor[] => {
  return privsOfTypeWithScope(user, RecordTypes.ORGANISATION, ScopeDefinitions.CreateSamples).map(
    (x) => {
      return {
        abbreviation: x.recordName,
      } as OrgDescriptor;
    },
  );
};

export const getUploadableSeqOrgs = (user: UserSliceState): OrgDescriptor[] => {
  return privsOfTypeWithScope(
    user,
    RecordTypes.ORGANISATION,
    ScopeDefinitions.UploadSequenceFiles,
  ).map((x) => {
    return {
      abbreviation: x.recordName,
    } as OrgDescriptor;
  });
};

export const getSampleSharableProjects = (user: UserSliceState): string[] => {
  return privsOfTypeWithScope(
    user,
    RecordTypes.PROJECT,
    ScopeDefinitions.LinkUnlinkSamplesToProject,
  ).map((x) => x.recordName);
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
  id: string;
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
      id: crypto.randomUUID(),
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
      id: crypto.randomUUID(),
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
      id: crypto.randomUUID(),
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

  const additionalFiles = [
    ...new Set(files.map((f) => f.file.name).filter((name) => !matchedFileNames.has(name))),
  ];

  if (additionalFiles.length > 0) {
    errors.push({
      id: crypto.randomUUID(),
      sampleName: undefined,
      errorType: CsvErrorType.ADDITIONAL,
      items: additionalFiles,
    });
  }
  return { rows, missing: errors };
};

// A list of regexes (one or more) matching possible filename formats once suffix stripped off.
// For most seqtypes we just strip the suffixes and take the remaining filename to be the Seq_ID, but for some we have
// regex-based logic.

// For paired-end, we MUST match a regex in order to capture a read number, however simple names like
// sampleName_1 will match.
// SeqType.FastqIllPe Illumina standard formats capture:
//  (.*?) - the Seq_ID
//  (_S\d+)? - optional like e.g. _S23 (sample number); (?:) means non-capturing group,we only capture sample name/read
//  (_L\d{3})? - optional like e.g. _L001 (lane number)
//  [-_.]R?[12] - mandatory read number, e.g. _R1, -R1, _1, .R1, etc
//  (_\d{3})? - optional like e.g. _001. Note nothing else may follow the read number in this format
// Most parts are optional so this matches MySample_R1.fastq.gz as well as MySample_S17_L001_R1_001.fastq.gz
const fastq_ill_paired_regexes = [/^(.+?)(?:_S\d+)?(?:_L\d{3})?[-_.][rR]?([12])(?:_\d{3})?$/];

export const createPairedSeqUploadRows = (
  files: DropFileUpload[],
  suffixes: string[],
  splitOnUnderscores: boolean = false,
): SeqPairedUploadRow[] => {
  var pairedFiles: Record<string, Record<string, DropFileUpload[]>> = {};
  for (const fileUpload of files) {
    // apply each regex in fastq_ill_paired_regexes till one matches
    // even in 'split on underscores' mode, paired-end data must match regex as we want reliable read pair
    const nameWithoutSuffix = stripSuffix(fileUpload.file.name, suffixes);

    let matched = false;
    for (const regex of fastq_ill_paired_regexes) {
      const match = nameWithoutSuffix.match(regex);
      if (match) {
        const [, matchedSampleName, readNum] = match;
        const sampleName = splitOnUnderscores ? matchedSampleName.split('_')[0] : matchedSampleName;
        pairedFiles[sampleName] ??= {};
        pairedFiles[sampleName][readNum] ??= [];
        pairedFiles[sampleName][readNum].push(fileUpload);
        matched = true;
        break;
      }
    }
    if (!matched) {
      throw new Error(
        `Unable to parse Seq_ID and read number from filename: ${fileUpload.file.name}`,
      );
    }
  }

  var rows: SeqPairedUploadRow[] = [];
  for (const [sampleName, sampleFiles] of Object.entries(pairedFiles)) {
    const numFiles = Object.keys(sampleFiles).length;
    if (numFiles !== 2)
      throw new Error(`Expected exactly 2 files for sample ${sampleName}, found ${numFiles}`);
    // Read values should be exactly '1' and '2'
    if (!sampleFiles['1'] || !sampleFiles['2'])
      throw new Error(
        `Expected reads 1 and 2 for sample ${sampleName}, parsed ${Object.keys(sampleFiles).join(' and ')}`,
      );
    if (sampleFiles['1'].length > 1)
      throw new Error(`Multiple files match the same read (1) for sample ${sampleName}`);
    if (sampleFiles['2'].length > 1)
      throw new Error(`Multiple files match the same read (2) for sample ${sampleName}`);

    rows.push({
      id: crypto.randomUUID(),
      seqId: sampleName,
      read1: sampleFiles['1'][0],
      read2: sampleFiles['2'][0],
      seqType: SeqType.FastqIllPe,
      state: SeqUploadRowState.Waiting,
    } as SeqPairedUploadRow);
  }

  return rows;
};

export const createSingleSeqUploadRows = (
  files: DropFileUpload[],
  seqType: SeqType,
  suffixes: string[],
  splitOnUnderscores: boolean = false,
): SeqSingleUploadRow[] => {
  var sampleFiles: Record<string, DropFileUpload[]> = {};
  for (const fileUpload of files) {
    // For all single-end types, just take the filename (sans suffix) to be the Seq_ID
    // Note based on feedback we are not bothering to strip possible file parts for Illumina SE
    const nameWithoutSuffix = stripSuffix(fileUpload.file.name, suffixes);
    const sampleName = splitOnUnderscores ? nameWithoutSuffix.split('_')[0]: nameWithoutSuffix;

    sampleFiles[sampleName] ??= [];
    sampleFiles[sampleName].push(fileUpload);
  }

  var rows: SeqSingleUploadRow[] = [];
  for (const [sampleName, fileArray] of Object.entries(sampleFiles)) {
    if (fileArray.length > 1)
      throw new Error(
        `Expected exactly 1 file for sample ${sampleName}, found ${fileArray.length}`,
      );
    rows.push({
      id: crypto.randomUUID(),
      seqId: sampleName,
      file: fileArray[0],
      seqType,
      state: SeqUploadRowState.Waiting,
    } as SeqSingleUploadRow);
  }

  return rows;
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
    throw new Error(UploadErrorMessages.INVALID_FILE_CONTENT);
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
      throw new Error(UploadErrorMessages.INVALID_SEQ_ID);
    }
    if (!row.filepath || row.filepath.trim() === '') {
      throw new Error(UploadErrorMessages.FILEPATH_PARSING_FAILED);
    }
  });

  if (!seqIdsAreUnique(parsed)) {
    throw new Error(UploadErrorMessages.DUPLICATE_SEQ_ID);
  }

  return parsed;
};

export const parseSeqUploadCsvPairs = async (pairingFile: File) => {
  const fileContent = await pairingFile.text();

  if (!fileContent || fileContent.length < 1) {
    throw new Error(UploadErrorMessages.INVALID_FILE_CONTENT);
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
      throw new Error(UploadErrorMessages.INVALID_SEQ_ID);
    }
    if (!row.filepath1 || row.filepath1.trim() === '') {
      throw new Error(UploadErrorMessages.FILEPATH_PARSING_FAILED);
    }
    if (!row.filepath2 || row.filepath2.trim() === '') {
      throw new Error(UploadErrorMessages.FILEPATH_PARSING_FAILED);
    }
  });

  if (!seqIdsAreUnique(parsed)) {
    throw new Error(UploadErrorMessages.DUPLICATE_SEQ_ID);
  }

  return parsed;
};

const seqIdsAreUnique = (seqRows: SeqUploadCsv[]) => {
  const seqIds = seqRows.map((row) => row.Seq_ID);
  return new Set(seqIds).size === seqIds.length;
};

export const findDuplicateSeqIds = (rows: SeqUploadRow[]): Set<string> => {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const seqId = row.seqId?.trim(); // todo: not sure we need to trim or not at this stage
    if (!seqId) continue;
    counts.set(seqId, (counts.get(seqId) ?? 0) + 1);
  }

  const duplicates = new Set<string>();
  for (const [seqId, count] of counts) {
    if (count > 1) duplicates.add(seqId);
  }
  return duplicates;
};
