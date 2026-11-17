import type { DropFileUpload } from '../../src/types/DropFileUpload';

export function mockFile(name: string, content: string, type: string = 'text/plain'): File {
  const blob = new Blob([content], { type: type });
  const file = new File([blob], name);
  file.text = () => Promise.resolve(content);
  return file;
}

export const mockFileUpload = (
  name: string,
  content: string,
  type: string = 'text/plain',
): DropFileUpload => ({
  file: mockFile(name, content, type),
  hash: undefined,
});

// jsdom File objects don't have text(), so a utility function
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
