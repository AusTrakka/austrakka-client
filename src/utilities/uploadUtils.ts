import {CustomUploadValidator, CustomUploadValidatorReturn} from "../components/Upload/FileDragDrop2";

export const validateEvenNumberOfFiles = {
  func: (files: File[]) => {return {
    success: files.length % 2 === 0,
    message: "Must upload an even number of files",
  } as CustomUploadValidatorReturn},
} as CustomUploadValidator