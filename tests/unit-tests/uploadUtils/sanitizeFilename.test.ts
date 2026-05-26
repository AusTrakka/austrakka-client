import { sanitizeFilename } from '../../../src/utilities/uploadUtils';

describe('sanitizeFilename', () => {
  it('should remove trailing spaces', () => {
    expect(sanitizeFilename('filename.txt   ')).toBe('filename.txt');
  });

  it('should remove trailing tabs', () => {
    expect(sanitizeFilename('filename.txt\t\t')).toBe('filename.txt');
  });

  it('should remove trailing newlines', () => {
    expect(sanitizeFilename('filename.txt\n\n')).toBe('filename.txt');
  });

  it('should preserve leading whitespace', () => {
    expect(sanitizeFilename('   filename.txt')).toBe('   filename.txt');
  });

  it('should preserve internal whitespace', () => {
    expect(sanitizeFilename('file name.txt')).toBe('file name.txt');
  });

  it('should return empty string when given empty string', () => {
    expect(sanitizeFilename('')).toBe('');
  });

  it('should handle mixed trailing whitespace', () => {
    expect(sanitizeFilename('filename.txt \t\n  ')).toBe('filename.txt');
  });
});
