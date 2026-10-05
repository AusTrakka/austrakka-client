import { getSampleNameFromFile } from '../../utilities/uploadUtils';

// Interfaces
export interface CustomUploadValidatorReturn {
  success: boolean;
  message: string;
}

export interface CustomUploadValidator {
  func: (files: File[], suffixes?: string[], maxFileSize?: number) => CustomUploadValidatorReturn;
}

// Validators
export const validateFilesAreOfType = {
  func: (_files: File[], _suffixes: string[]) =>
    ({
      success:
        _suffixes.length === 0 ||
        _files.every((f) =>
          _suffixes.some((ex) => f.name.toLowerCase().endsWith(ex.toLowerCase())),
        ),
      message: `All files must be of a valid format: ${_suffixes.join(', ')}`,
    }) as CustomUploadValidatorReturn,
} as CustomUploadValidator;

export const validateSingleFile = {
  func: (_files: File[]) =>
    ({
      success: _files.length === 1,
      message: 'Only one file can be selected',
    }) as CustomUploadValidatorReturn,
} as CustomUploadValidator;

export const validateEvenNumberOfFiles = {
  func: (files: File[], _suffixes: string[]) =>
    ({
      success: files.length % 2 === 0,
      message: 'Must upload an even number of files for paired-end sequence data',
    }) as CustomUploadValidatorReturn,
} as CustomUploadValidator;

export const validateNoDuplicateFilenames = {
  func: (files: File[], _suffixes: string[]) => {
    const filenames = files.map((f) => f.name);
    const duplicates = filenames.filter((item, index) => filenames.indexOf(item) !== index);
    if (duplicates.length > 0) {
      return {
        success: false,
        message: `The following files appear more than once: ${duplicates.join(', ')}`,
      } as CustomUploadValidatorReturn;
    }
    return {
      success: true,
      message: '',
    } as CustomUploadValidatorReturn;
  },
} as CustomUploadValidator;

export const validateAllHaveSampleNamesWithTwoFilesOnly = {
  func: (files: File[], suffixes: string[]) => {
    const sampleCounts = countElements(files.map((f) => getSampleNameFromFile(f.name, suffixes)));
    const problemSampleNames = Object.entries(sampleCounts)
      .filter(([_sample, count]) => count !== 2)
      .map(([sample, _count]) => sample);
    if (problemSampleNames.length > 0) {
      return {
        success: false,
        message: `Unable to parse file pairs for the following samples: ${problemSampleNames.join(', ')}`,
      } as CustomUploadValidatorReturn;
    }
    return {
      success: true,
    } as CustomUploadValidatorReturn;
  },
} as CustomUploadValidator;

export const validateAllHaveSampleNamesWithOneFileOnly = {
  func: (_files: File[], _suffixes: string[]) => {
    const sampleCounts = countElements(_files.map((f) => getSampleNameFromFile(f.name, _suffixes)));
    const problemSampleNames = Object.entries(sampleCounts)
      .filter(([_sample, count]) => count !== 1)
      .map(([sample, _count]) => sample);
    if (problemSampleNames.length > 0) {
      return {
        success: false,
        message: `Found too many files for the following samples: ${problemSampleNames.join(', ')}`,
      } as CustomUploadValidatorReturn;
    }
    return {
      success: true,
    } as CustomUploadValidatorReturn;
  },
} as CustomUploadValidator;

export const validateFileSizeLimit = {
  func: (_files: File[], _suffixes: string[], _maxFileSize?: number) => {
    if (!_maxFileSize) {
      throw new Error('Max file size is null or undefined');
    }

    return {
      success: _files.every((f) => f.size <= _maxFileSize),
      message: `All files must be smaller than ${(_maxFileSize / (1024 * 1024)).toFixed(2)}MB`,
    } as CustomUploadValidatorReturn;
  },
} as CustomUploadValidator;

// Private Functions
function countElements(array: any[]): Record<string, number> {
  const count: Record<string, number> = {};
  array.forEach((val) => {
    count[val] = (count[val] || 0) + 1;
  });
  return count;
}
