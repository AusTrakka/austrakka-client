import { splitFastaByContig } from '../../../src/utilities/uploadUtils';

const testFileContent = `>contig1 description
ATGCATGCATGC
>contig2 description
GGCATGCATGCA
>contig3 description
TTTTTTTTTTTT
`;

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
});
