import type { DropFileUpload } from './DropFileUpload';

export enum SeqType {
  FastqIllPe = 'fastq-ill-pe',
  FastqIllSe = 'fastq-ill-se',
  FastqOnt = 'fastq-ont',
  FastaCns = 'fasta-cns',
  FastaAsm = 'fasta-asm',
}

export const seqTypeNames: Record<string, string> = {
  [SeqType.FastqIllPe]: 'Illumina Paired-End FASTQ',
  [SeqType.FastqIllSe]: 'Illumina Single-End FASTQ',
  [SeqType.FastqOnt]: 'Oxford Nanopore FASTQ',
  [SeqType.FastaCns]: 'Consensus FASTA (single contig per sample)',
  [SeqType.FastaAsm]: 'Assembly FASTA',
};

export const seqTypeClasses: Record<SeqType, string> = {
  [SeqType.FastqIllPe]: 'fastq',
  [SeqType.FastqIllSe]: 'fastq',
  [SeqType.FastqOnt]: 'fastq',
  [SeqType.FastaCns]: 'fasta',
  [SeqType.FastaAsm]: 'fasta',
};

const validFormatsPerClass: Record<string, Record<string, string>> = {
  fastq: {
    '.fq': '',
    '.fastq': '',
    '.fq.gz': 'application/x-gzip',
    '.fastq.gz': 'application/x-gzip',
  },
  fasta: {
    '.fa': '',
    '.fasta': '',
    '.fa.gz': 'application/x-gzip',
    '.fasta.gz': 'application/x-gzip',
  },
};

export const validFormats = (seqType: SeqType) => validFormatsPerClass[seqTypeClasses[seqType]];

export interface OrgDescriptor {
  abbreviation: string;
  name: string;
}

export enum SkipForce {
  None = '',
  Skip = 'skip',
  Force = 'overwrite',
}

export enum SeqUploadRowState {
  Waiting = 'Waiting',
  Queued = 'Queued',
  CreateSample = 'Create Sample',
  CalculatingHash = 'Calculating Hash',
  CalculatedHash = 'Calculated Hash',
  Uploading = 'Uploading',
  Complete = 'Complete',
  Incomplete = 'Incomplete', // TODO: Not sure about this name
  Skipped = 'Skipped', // TODO use if skipped
  Errored = 'Errored',
}

export interface SeqUploadRow {
  id: string;
  seqId: string;
  seqType: SeqType;
  state: SeqUploadRowState;
  clientSessionId?: string | null;
}

export interface SeqPairedUploadRow extends SeqUploadRow {
  id: string;
  seqId: string;
  read1: DropFileUpload;
  read2: DropFileUpload;
  seqType: SeqType;
  state: SeqUploadRowState;
  clientSessionId?: string;
}

// This represents any single-file upload, including single-end fastq of different types, and
// fasta files we have produced by splitting a multi-sample fasta
export interface SeqSingleUploadRow extends SeqUploadRow {
  id: string;
  seqId: string;
  file: DropFileUpload;
  seqType: SeqType;
  state: SeqUploadRowState;
  clientSessionId?: string;
}
