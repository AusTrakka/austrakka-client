import { splitFastaByContig } from '../../../src/utilities/uploadUtils';

function mockFile(content: string, name: string = 'test.fasta'): File {
  const blob = new Blob([content], { type: 'text/plain' });
  const file = new File([blob], name);
  file.text = () => Promise.resolve(content);
  return file;
}

// jsdom File objects don't have text(), so a utility function
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

describe('splitFastaByContig', () => {
  test('should split a fasta file into separate files for each contig', async () => {
    const testFileContent = `>contig1 description
ATGCATGCATGC
>contig2 description
GGCATGCATGCA
>contig3 description
TTTTTTTTTTTT
`;
    const file = mockFile(testFileContent);

    // Act
    const result = await splitFastaByContig([file]);

    // Assert
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('contig1.fa');
    expect(await readFileAsText(result[0])).toBe('>contig1 description\nATGCATGCATGC\n');
    expect(result[1].name).toBe('contig2.fa');
    expect(await readFileAsText(result[1])).toBe('>contig2 description\nGGCATGCATGCA\n');
    expect(result[2].name).toBe('contig3.fa');
    expect(await readFileAsText(result[2])).toBe('>contig3 description\nTTTTTTTTTTTT\n');
  });

  test('should throw an error if the file contains duplicate Seq_IDs', async () => {
    const testFileContent = `>contig1 description
ATGCATGCATGC
>contig3 description
GGCATGCATGCA
>contig3 description
TTTTTTTTTTTT
`;
    const file = mockFile(testFileContent);

    await expect(() => splitFastaByContig([file])).rejects.toThrow();
  });

  test('given multiple files, should parse Seq_IDs from all', async () => {
    const testFileContent1 = `>contig1 description
ATGCATGCATGC
>contig2 description
GGCATGCATGCA
`;
    const testFileContent2 = `>contig3 description
TTTTTTTTTTTT
>contig4 description
CCCCCCCCCCCC
`;
    const file1 = mockFile(testFileContent1, 'file1.fasta');
    const file2 = mockFile(testFileContent2, 'file2.fasta');

    const result = await splitFastaByContig([file1, file2]);

    expect(result).toHaveLength(4);
    expect(result[0].name).toBe('contig1.fa');
    expect(result[1].name).toBe('contig2.fa');
    expect(result[2].name).toBe('contig3.fa');
    expect(result[3].name).toBe('contig4.fa');
  });

  test('given multiple files, should parse Seq_IDs from all and throw an error if there are duplicates across files', async () => {
    const testFileContent1 = `>contig1 description
ATGCATGCATGC
>contig2 description
GGCATGCATGCA
`;
    const testFileContent2 = `>contig2 description
TTTTTTTTTTTT
>contig3 description
CCCCCCCCCCCC
`;
    const file1 = mockFile(testFileContent1, 'file1.fasta');
    const file2 = mockFile(testFileContent2, 'file2.fasta');

    await expect(() => splitFastaByContig([file1, file2])).rejects.toThrow();
  });

  test('given pipe characters in contig names, should split on first pipe and use the part before the pipe as the Seq_ID', async () => {
    const testFileContent = `>contig1|restofheader
ATGCATGCATGC
>contig2|restofheader
GGCATGCATGCA
>contig3|restofheader
TTTTTTTTTTTT
`;
    const file = mockFile(testFileContent);

    // Act
    const result = await splitFastaByContig([file]);

    // Assert
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('contig1.fa');
    expect(await readFileAsText(result[0])).toBe('>contig1|restofheader\nATGCATGCATGC\n');
    expect(result[1].name).toBe('contig2.fa');
    expect(await readFileAsText(result[1])).toBe('>contig2|restofheader\nGGCATGCATGCA\n');
    expect(result[2].name).toBe('contig3.fa');
    expect(await readFileAsText(result[2])).toBe('>contig3|restofheader\nTTTTTTTTTTTT\n');
  });

  test('given pipe characters in contig names, should throw an error if the file contains Seq_IDs that are duplicate after trimming', async () => {
    const testFileContent = `>contig1 description
ATGCATGCATGC
>contig3|version1 description
GGCATGCATGCA
>contig3|alternate description
TTTTTTTTTTTT
`;
    const file = mockFile(testFileContent);

    await expect(() => splitFastaByContig([file])).rejects.toThrow();
  });
});
