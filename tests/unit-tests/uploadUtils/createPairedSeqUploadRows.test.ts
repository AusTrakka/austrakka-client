import { createPairedSeqUploadRows } from '../../../src/utilities/uploadUtils';
import type { DropFileUpload } from '../../../src/types/DropFileUpload';
import { mockFileUpload } from '../../test-utils/fileUtils';

// We do not care about file contents or type in these tests, just build using name
const makeUpload = (name: string): DropFileUpload => 
  mockFileUpload(name, 'dummy content', 'text/plain');


describe('createPairedSeqUploadRows', () => {
  
  const suffixes = ['.fastq.gz', '.fq.gz'];

  describe('should parse valid files correctly when accepting underscores', () => {

    test('pairs simple _1/_2 filenames', () => {
      const files = [makeUpload('SampleA_A_1.fastq.gz'), makeUpload('SampleA_A_2.fastq.gz')];

      const rows = createPairedSeqUploadRows(files, suffixes);

      expect(rows).toHaveLength(1);
      expect(rows[0].seqId).toBe('SampleA_A');
      expect(rows[0].read1.file.name).toBe('SampleA_A_1.fastq.gz');
      expect(rows[0].read2.file.name).toBe('SampleA_A_2.fastq.gz');
    });

    test('pairs Illumina-style filenames with sample/lane info', () => {
      const files = [
        makeUpload('SampleB_B_S17_L001_R1_001.fastq.gz'),
        makeUpload('SampleB_B_S17_L001_R2_001.fastq.gz'),
      ];

      const rows = createPairedSeqUploadRows(files, suffixes);

      expect(rows).toHaveLength(1);
      expect(rows[0].seqId).toBe('SampleB_B');
      expect(rows[0].read1.file.name).toContain('_R1_');
      expect(rows[0].read2.file.name).toContain('_R2_');
    });
    
    test('pairs MGI-style filenames with barcode number', () => {
      const files = [
        makeUpload('SampleC_C_L01_101_1.fastq.gz'),
        makeUpload('SampleC_C_L01_101_2.fastq.gz'),
      ];

      const rows = createPairedSeqUploadRows(files, suffixes);

      expect(rows).toHaveLength(1);
      expect(rows[0].seqId).toBe('SampleC_C');
      expect(rows[0].read1.file.name).toContain('_1');
      expect(rows[0].read2.file.name).toContain('_2');
    });

  });

  describe('should parse correctly when splitting on underscores', () => {

    test('truncates simple sample name at first underscore', () => {
      const files = [
        makeUpload('SampleC_extra_R1.fastq.gz'),
        makeUpload('SampleC_extra_R2.fastq.gz'),
      ];

      const rows = createPairedSeqUploadRows(files, suffixes, true);

      expect(rows).toHaveLength(1);
      expect(rows[0].seqId).toBe('SampleC');
    });
    
  });

  describe('handles error cases', () => {

    test('when a filename cannot be parsed', () => {
      const files = [makeUpload('not_a_valid_pair_name.fastq.gz')];

      expect(() => createPairedSeqUploadRows(files, suffixes)).toThrow(
        /Unable to parse Seq_ID and read number/,
      );
    });

    test('when only one read of a pair is present', () => {
      const files = [
        makeUpload('SampleD_1.fastq.gz'), 
        makeUpload('SampleD_1_1.fastq.gz'),
        makeUpload('SampleD_1_2.fastq.gz')];

      expect(() => createPairedSeqUploadRows(files, suffixes)).toThrow(
        /Expected exactly 2 files/,
      );
    });

    test('throws when more than one file matches the same read', () => {
      const files = [
        makeUpload('SampleE_1.fastq.gz'),
        makeUpload('SampleE_R1.fastq.gz'),
        makeUpload('SampleE_2.fastq.gz'),
      ];

      expect(() => createPairedSeqUploadRows(files, suffixes)).toThrow(
        /Multiple files match the same read/,
      );
    });

  });
});