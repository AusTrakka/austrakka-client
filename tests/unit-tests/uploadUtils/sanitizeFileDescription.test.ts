import { sanitizeFileDescription } from '../../../src/utilities/uploadUtils';

describe('sanitizeFileDescription', () => {
  it('should remove null character', () => {
    expect(sanitizeFileDescription('description\u0000text')).toBe('descriptiontext');
  });

  it('should remove all control characters from range \\u0000-\\u001F', () => {
    expect(sanitizeFileDescription('text\u0001\u0002\u0003')).toBe('text');
  });

  it('should remove tab character', () => {
    expect(sanitizeFileDescription('description\ttext')).toBe('descriptiontext');
  });

  it('should remove newline characters', () => {
    expect(sanitizeFileDescription('description\ntext')).toBe('descriptiontext');
  });

  it('should remove carriage return', () => {
    expect(sanitizeFileDescription('description\rtext')).toBe('descriptiontext');
  });

  it('should preserve normal characters and spaces', () => {
    expect(sanitizeFileDescription('Normal description with numbers 123')).toBe(
      'Normal description with numbers 123',
    );
  });

  it('should return empty string when given empty string', () => {
    expect(sanitizeFileDescription('')).toBe('');
  });

  it('should handle multiple control characters', () => {
    expect(sanitizeFileDescription('A\u0000B\u0001C\u001FD')).toBe('ABCD');
  });

  it('should preserve unicode characters outside control range', () => {
    expect(sanitizeFileDescription('Description with émojis 🎉')).toBe(
      'Description with émojis 🎉',
    );
  });

  it('should only remove characters in the specified range', () => {
    expect(sanitizeFileDescription('Text with\u001Fcontrol and normal chars')).toBe(
      'Text withcontrol and normal chars',
    );
  });
});
