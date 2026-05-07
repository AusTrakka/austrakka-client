import { checkFilename } from '../../../src/utilities/uploadUtils';

describe('checkFilename', () => {
  it('should return true for valid filenames', () => {
    expect(checkFilename('document.pdf')).toBe(true);
    expect(checkFilename('my-file_v2.txt')).toBe(true);
    expect(checkFilename('file123')).toBe(true);
  });

  it('should return false for filenames with forward slash', () => {
    expect(checkFilename('path/to/file.txt')).toBe(false);
  });

  it('should return false for filenames with backslash', () => {
    expect(checkFilename('path\\to\\file.txt')).toBe(false);
  });

  it('should return false for filenames with ampersand', () => {
    expect(checkFilename('file&name.txt')).toBe(false);
  });

  it('should return false for filenames with pipe', () => {
    expect(checkFilename('file|name.txt')).toBe(false);
  });

  it('should return false for filenames with semicolon', () => {
    expect(checkFilename('file;name.txt')).toBe(false);
  });

  it('should return false for filenames with colon', () => {
    expect(checkFilename('file:name.txt')).toBe(false);
  });

  it('should return false for filenames with angle brackets', () => {
    expect(checkFilename('file<name>.txt')).toBe(false);
    expect(checkFilename('file>name.txt')).toBe(false);
  });

  it('should return false for filenames with quotes', () => {
    expect(checkFilename('file"name.txt')).toBe(false);
    expect(checkFilename("file'name.txt")).toBe(false);
  });

  it('should return false for filenames with question mark', () => {
    expect(checkFilename('file?name.txt')).toBe(false);
  });

  it('should return false for filenames with exclamation mark', () => {
    expect(checkFilename('file!name.txt')).toBe(false);
  });

  it('should return false for filenames with asterisk', () => {
    expect(checkFilename('file*name.txt')).toBe(false);
  });

  it('should return true for empty string', () => {
    expect(checkFilename('')).toBe(true);
  });

  it('should return true for filename with spaces', () => {
    expect(checkFilename('my file name.txt')).toBe(true);
  });
});
