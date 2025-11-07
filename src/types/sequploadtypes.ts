import { DropFileUpload } from './DropFileUpload';

export enum SeqType {
  FastqIllPe = 'fastq-ill-pe',
  FastqIllSe = 'fastq-ill-se',
  FastqOnt = 'fastq-ont',
}

export const seqTypeNames: Record<string, string> = {
  [SeqType.FastqIllPe]: 'Illumina Paired-End FASTQ',
  [SeqType.FastqIllSe]: 'Illumina Single-End FASTQ',
  [SeqType.FastqOnt]: 'Oxford Nanopore FASTQ',
};

export interface OrgDescriptor {
  abbreviation: string,
  name: string,
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
  Issues = 'Issues', // TODO: Not sure about this name
  Errored = 'Errored',
}

export interface SeqUploadRow {
  id: string
  seqId: string
  seqType: SeqType
  state: SeqUploadRowState
}

export interface SeqPairedUploadRow extends SeqUploadRow {
  id: string
  seqId: string
  read1: DropFileUpload
  read2: DropFileUpload
  seqType: SeqType
  state: SeqUploadRowState
}

export interface SeqSingleUploadRow extends SeqUploadRow {
  id: string
  seqId: string
  file: DropFileUpload
  seqType: SeqType
  state: SeqUploadRowState
}
