// noinspection DuplicatedCode

import { parseSeqUploadCsvPairs } from '../../../src/utilities/uploadUtils';
import { mockFile } from '../../test-utils/fileUtils';

// Helpers and constants

const defaultFileName = 'default.csv';
const validHeaders = ['Seq_ID', 'filepath1', 'filepath2'];

const getPairFile = (rows: string[]) => {
  let contents = validHeaders.join(',');
  rows.forEach((row) => {
    contents += `\n${row}`;
  });
  return mockFile(defaultFileName, contents, 'csv');
};

describe('parsePairingFile', () => {
  it('should parse single pair', async () => {
    // Arrange
    const seqId = 'Sample1';
    const fp1 = 'sample1_r1.fastq';
    const fp2 = 'sample1_r2.fastq';

    const rows = [`${seqId},${fp1},${fp2}`];

    const pairFile = getPairFile(rows);

    // Act
    const result = await parseSeqUploadCsvPairs(pairFile);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].Seq_ID).toBe(seqId);
    expect(result[0].filepath1).toBe(fp1);
    expect(result[0].filepath2).toBe(fp2);
  });

  it('should parse multiple pairs', async () => {
    // Arrange
    const seqIdBase = 'Sample';
    const fp1Base = 'yin_sample.fastq';
    const fp2Base = 'yang_sample.fastq';

    const rows: string[] = [];
    const max = 100;

    for (let i = 0; i < max; i++) {
      rows.push(`${seqIdBase}${i},${i}${fp1Base},${i}${fp2Base}`);
    }

    const pairFile = getPairFile(rows);

    // Act
    const result = await parseSeqUploadCsvPairs(pairFile);

    // Assert
    expect(result).toHaveLength(max);
    rows.forEach((row, index) => {
      const values = row.split(',');
      expect(result[index].Seq_ID).toBe(values[0]);
      expect(result[index].filepath1).toBe(values[1]);
      expect(result[index].filepath2).toBe(values[2]);
    });
  });

  it('should truncate trailing delimiters', async () => {
    // Arrange
    const seqId = 'Sample1';
    const fp1 = 'sample1_r1.fastq';
    const fp2 = 'sample1_r2.fastq';

    const rows = [`${seqId},${fp1},${fp2},`];

    const pairFile = getPairFile(rows);

    // Act
    const result = await parseSeqUploadCsvPairs(pairFile);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].Seq_ID).toBe(seqId);
    expect(result[0].filepath1).toBe(fp1);
    expect(result[0].filepath2).toBe(fp2);
  });

  it.each([
    { seqId: '' },
    { seqId: '   ' },
  ])('should fail when given invalid Seq ID (Seq_ID: "$seqId")', async ({ seqId }) => {
    // Arrange
    const fp1 = 'sample1_r1.fastq';
    const fp2 = 'sample1_r2.fastq';

    const rows = [`${seqId},${fp1},${fp2},`];

    const pairFile = getPairFile(rows);

    // Act
    const promise = parseSeqUploadCsvPairs(pairFile);

    // Assert
    await expect(promise).rejects.toThrow('Invalid Seq_ID');
  });

  it.each([
    { filepath: '' },
    { filepath: '   ' },
  ])('should fail when given invalid filepath (Path: "$filepath")', async ({ filepath }) => {
    // Arrange
    const seqId = 'Sample1';

    const rows = [`${seqId},${filepath},${filepath},`];

    const pairFile = getPairFile(rows);

    // Act
    const promise = parseSeqUploadCsvPairs(pairFile);

    // Assert
    await expect(promise).rejects.toThrow('Unable to parse filepath');
  });

  it('should ignore empty lines', async () => {
    // Arrange
    const seqId1 = 'Sample1';
    const yin1 = 'sample1_r1.fastq';
    const yang1 = 'sample1_r2.fastq';

    const seqId2 = 'Sample2';
    const yin2 = 'sample2_r1.fastq';
    const yang2 = 'sample2_r2.fastq';

    const rows = [`${seqId1},${yin1},${yang1}`, ',,', `${seqId2},${yin2},${yang2}`];

    const pairFile = getPairFile(rows);

    // Act
    const result = await parseSeqUploadCsvPairs(pairFile);

    // Assert
    expect(result).toHaveLength(2);

    expect(result[0].Seq_ID).toBe(seqId1);
    expect(result[0].filepath1).toBe(yin1);
    expect(result[0].filepath2).toBe(yang1);

    expect(result[1].Seq_ID).toBe(seqId2);
    expect(result[1].filepath1).toBe(yin2);
    expect(result[1].filepath2).toBe(yang2);
  });
});
