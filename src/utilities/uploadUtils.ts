import {CustomUploadValidator} from "../components/Upload/FileDragDrop2";

export const validateEvenNumberOfFiles = {
  func: (files: File[]) => files.length % 2 === 0,
  message: "Must upload an even number of files",
} as CustomUploadValidator
