import { createSingleSeqUploadRows } from '../../../src/utilities/uploadUtils';
import type { DropFileUpload } from '../../../src/types/DropFileUpload';
import { SeqType } from '../../../src/types/sequploadtypes';
import { mockFileUpload } from '../../test-utils/fileUtils';

// We do not care about file contents or type in these tests, just build using name
const makeUpload = (name: string): DropFileUpload =>
  mockFileUpload(name, 'dummy content', 'text/plain');

describe('createSingleSeqUploadRows', () => {

  const fastq_suffixes = ['.fastq.gz', '.fq.gz'];
  const fasta_suffixes = ['.fasta.gz', '.fa.gz'];

  describe('should parse valid files correctly when accepting underscores', () => {

    test('uses filename (sans suffix) as Seq_ID', () => {
      const files = [makeUpload('SampleA_A.fasta.gz')];

      const rows = createSingleSeqUploadRows(files, SeqType.FastaAsm, fasta_suffixes);

      expect(rows).toHaveLength(1);
      expect(rows[0].seqId).toBe('SampleA_A');
      expect(rows[0].file.file.name).toBe('SampleA_A.fasta.gz');
      expect(rows[0].seqType).toBe(SeqType.FastaAsm);
    });

    test('handles multiple distinct samples', () => {
      const files = [
        makeUpload('SampleC_C.fastq.gz'),
        makeUpload('SampleD_D.fastq.gz')
      ];

      const rows = createSingleSeqUploadRows(files, SeqType.FastqIllSe, fastq_suffixes);

      expect(rows).toHaveLength(2);
      expect(rows[0].seqId).toBe('SampleC_C');
      expect(rows[1].seqId).toBe('SampleD_D');
    });

  });

  describe('should parse correctly when splitting on underscores', () => {

    test('truncates sample name at first underscore', () => {
      const files = [makeUpload('SampleE_extra_info.fasta.gz')];

      const rows = createSingleSeqUploadRows(files, SeqType.FastaAsm, fasta_suffixes, true);

      expect(rows).toHaveLength(1);
      expect(rows[0].seqId).toBe('SampleE');
    });

  });

  describe('handles error cases', () => {

    test('throws when more than one file matches the same sample name', () => {
      const files = [
        makeUpload('SampleF.fastq.gz'),
        makeUpload('SampleF.fq.gz'),
      ];

      expect(() => createSingleSeqUploadRows(files, SeqType.FastqIllSe, fastq_suffixes)).toThrow(
        /Expected exactly 1 file for sample/,
      );
    });

    test('throws when splitOnUnderscores causes a sample name collision', () => {
      const files = [
        makeUpload('SampleG_1.fastq.gz'),
        makeUpload('SampleG_2.fastq.gz'),
      ];

      expect(() =>
        createSingleSeqUploadRows(files, SeqType.FastqIllSe, fastq_suffixes, true),
      ).toThrow(/Expected exactly 1 file for sample/);
    });

  });
});

