export interface CustomUploadValidatorReturn {
  success: boolean,
  message: string,
}

export interface CustomUploadValidator {
  func: (files: File[]) => CustomUploadValidatorReturn,
}


export const validateEvenNumberOfFiles = {
  func: (files: File[]) => {
    return {
      success: files.length % 2 === 0,
      message: "Must upload an even number of files",
    } as CustomUploadValidatorReturn
  },
} as CustomUploadValidator

export const validateNoDuplicateFilenames = {
  func: (files: File[]) => {
    const filenames = files.map(f => f.name);
    const duplicates = filenames.filter((item, index) => filenames.indexOf(item) !== index);
    if (duplicates.length > 0) {
      return {
        success: false,
        message: "The following files appear more than once: " + duplicates.join(", "),
      } as CustomUploadValidatorReturn
    }
    return {
      success: true,
      message: "",
    } as CustomUploadValidatorReturn
  },
} as CustomUploadValidator
