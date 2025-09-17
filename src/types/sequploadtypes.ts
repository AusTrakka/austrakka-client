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
  CalculatingHash = 'Calculating Hash',
  CalculatedHash = 'Calculated Hash',
  Uploading = 'Uploading',
  Complete = 'Complete',
  Skipped = 'Skipped', // TODO use if skipped
  Errored = 'Errored',
}

export interface SeqUploadRow {
  id: string
  seqId: string
  seqType: SeqType
  state: SeqUploadRowState
  clientSessionId?: string | null
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
