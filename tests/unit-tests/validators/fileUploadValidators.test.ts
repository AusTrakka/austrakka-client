import {
  validateEvenNumberOfFiles,
  validateFileSizeLimit,
  validateFilesAreOfType,
  validateNoDuplicateFilenames,
  validateSingleFile,
} from '../../../src/components/Upload/fileUploadValidators';
import { mockFile } from '../../test-utils/fileUtils';

describe('validateFilesAreOfType', () => {
  it('should accept valid files (single type)', () => {
    // Arrange
    const validator = validateFilesAreOfType;
    const suffixes = ['.csv'];
    const testFiles = [mockFile('test.csv', '', 'csv')];

    // Act
    const result = validator.func(testFiles, suffixes);

    // Assert
    expect(result.success).toBe(true);
  });
  it('should accept valid files (various types)', () => {
    // Arrange
    const validator = validateFilesAreOfType;
    const suffixes = ['.csv', '.txt'];
    const testFiles = [mockFile('test.csv', '', 'csv'), mockFile('test.txt', '', 'txt')];

    // Act
    const result = validator.func(testFiles, suffixes);

    // Assert
    expect(result.success).toBe(true);
  });
  it('should reject invalid files', () => {
    // Arrange
    const validator = validateFilesAreOfType;
    const suffixes = ['.csv'];
    const testFiles = [mockFile('test.txt', '', 'txt')];

    // Act
    const result = validator.func(testFiles, suffixes);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe('validateSingleFile', () => {
  it('should accept single file', () => {
    // Arrange
    const validator = validateSingleFile;
    const testFiles = [mockFile('test.csv', '', 'csv')];

    // Act
    const result = validator.func(testFiles);

    // Assert
    expect(result.success).toBe(true);
  });
  it('should reject multiple files', () => {
    // Arrange
    const validator = validateSingleFile;
    const testFiles = [mockFile('test.csv', '', 'csv'), mockFile('test.txt', '', 'txt')];

    // Act
    const result = validator.func(testFiles);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe('validateEvenNumberOfFiles', () => {
  it('should accept even number of files', () => {
    // Arrange
    const validator = validateEvenNumberOfFiles;
    const testFiles = [mockFile('test.csv', '', 'csv'), mockFile('test.txt', '', 'txt')];

    // Act
    const result = validator.func(testFiles);

    // Assert
    expect(result.success).toBe(true);
  });
  it('should reject odd number of files', () => {
    // Arrange
    const validator = validateEvenNumberOfFiles;
    const testFiles = [mockFile('test.csv', '', 'csv')];

    // Act
    const result = validator.func(testFiles);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe('validateNoDuplicateFilenames', () => {
  it('should accept unique filenames', () => {
    // Arrange
    const validator = validateNoDuplicateFilenames;
    const testFiles = [mockFile('test.csv', '', 'csv'), mockFile('test.txt', '', 'csv')];

    // Act
    const result = validator.func(testFiles);

    // Assert
    expect(result.success).toBe(true);
  });
  it('should reject duplicate filenames', () => {
    // Arrange
    const validator = validateNoDuplicateFilenames;
    const testFiles = [mockFile('test.txt', '', 'csv'), mockFile('test.txt', '', 'csv')];

    // Act
    const result = validator.func(testFiles);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe('validateFileSizeLimit', () => {
  it('should accept valid filesize', () => {
    // Arrange
    const validator = validateFileSizeLimit;
    const testFiles = [mockFile('test.txt', '', 'csv')];

    // Act
    const result = validator.func(testFiles, undefined, 1);

    // Assert
    expect(result.success).toBe(true);
  });
  it('should reject invalid filesize', () => {
    // Arrange
    const validator = validateFileSizeLimit;
    const testFiles = [mockFile('test.csv', 'hello world!', 'csv')];

    // Act
    const result = validator.func(testFiles, undefined, 1);

    // Assert
    expect(result.success).toBe(false);
  });
});
