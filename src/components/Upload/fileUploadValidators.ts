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
