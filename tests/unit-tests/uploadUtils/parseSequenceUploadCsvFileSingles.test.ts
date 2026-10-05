// noinspection DuplicatedCode

import { UploadErrorMessages } from '../../../src/components/Upload/Constants/UploadMessages';
import { parseSeqUploadCsvSingles } from '../../../src/utilities/uploadUtils';
import { mockFile } from '../../test-utils/fileUtils';

// Helpers and constants

const defaultFileName = 'default.csv';
const validHeaders = ['Seq_ID', 'filepath'];

const getCsvFile = (rows: string[]) => {
  let contents = validHeaders.join(',');
  rows.forEach((row) => {
    contents += `\n${row}`;
  });
  return mockFile(defaultFileName, contents, 'csv');
};

describe('parseSeqUploadCsvSingles', () => {
  it('should parse single pair', async () => {
    // Arrange
    const seqId = 'Sample1';
    const fp = 'sample1_r1.fastq';

    const rows = [`${seqId},${fp}`];

    const csvFile = getCsvFile(rows);

    // Act
    const result = await parseSeqUploadCsvSingles(csvFile);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].Seq_ID).toBe(seqId);
    expect(result[0].filepath).toBe(fp);
  });

  it('should parse multiple records', async () => {
    // Arrange
    const seqIdBase = 'Sample';
    const fpBase = 'sample.fastq';

    const rows: string[] = [];
    const max = 100;

    for (let i = 0; i < max; i++) {
      rows.push(`${seqIdBase}${i},${i}${fpBase}`);
    }

    const csvFile = getCsvFile(rows);

    // Act
    const result = await parseSeqUploadCsvSingles(csvFile);

    // Assert
    expect(result).toHaveLength(max);
    rows.forEach((row, index) => {
      const values = row.split(',');
      expect(result[index].Seq_ID).toBe(values[0]);
      expect(result[index].filepath).toBe(values[1]);
    });
  });

  it('should truncate trailing delimiters', async () => {
    // Arrange
    const seqId = 'Sample1';
    const fp = 'sample1_r1.fastq';

    const rows = [`${seqId},${fp},`];

    const csvFile = getCsvFile(rows);

    // Act
    const result = await parseSeqUploadCsvSingles(csvFile);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].Seq_ID).toBe(seqId);
    expect(result[0].filepath).toBe(fp);
  });

  it.each([
    { seqId: '' },
    { seqId: '   ' },
  ])('should fail when given invalid Seq ID (Seq_ID: "$seqId")', async ({ seqId }) => {
    // Arrange
    const fp = 'sample1_r1.fastq';

    const rows = [`${seqId},${fp},`];

    const csvFile = getCsvFile(rows);

    // Act
    const promise = parseSeqUploadCsvSingles(csvFile);

    // Assert
    await expect(promise).rejects.toThrow(UploadErrorMessages.INVALID_SEQ_ID);
  });

  it.each([
    { filepath: '' },
    { filepath: '   ' },
  ])('should fail when given invalid filepath (Path: "$filepath")', async ({ filepath }) => {
    // Arrange
    const seqId = 'Sample1';

    const rows = [`${seqId},${filepath}`];

    const csvFile = getCsvFile(rows);

    // Act
    const promise = parseSeqUploadCsvSingles(csvFile);

    // Assert
    await expect(promise).rejects.toThrow(UploadErrorMessages.FILEPATH_PARSING_FAILED);
  });

  it('should ignore empty lines', async () => {
    // Arrange
    const seqId1 = 'Sample1';
    const sample1 = 'sample1_r1.fastq';

    const seqId2 = 'Sample2';
    const sample2 = 'sample2_r1.fastq';

    const rows = [`${seqId1},${sample1}`, ',,', `${seqId2},${sample2}`];

    const csvFile = getCsvFile(rows);

    // Act
    const result = await parseSeqUploadCsvSingles(csvFile);

    // Assert
    expect(result).toHaveLength(2);

    expect(result[0].Seq_ID).toBe(seqId1);
    expect(result[0].filepath).toBe(sample1);

    expect(result[1].Seq_ID).toBe(seqId2);
    expect(result[1].filepath).toBe(sample2);
  });
});
