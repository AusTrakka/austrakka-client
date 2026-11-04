import { parseFileNameFromPath } from '../../../src/utilities/uploadUtils';

describe('parseFilenameFromPath', () => {
  it('should remove parent directory', () => {
    expect(parseFileNameFromPath('/path/file.txt')).toBe('file.txt');
  });
  it('should remove parent directories', () => {
    expect(parseFileNameFromPath('/path/to/file.txt')).toBe('file.txt');
  });
});
