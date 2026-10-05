// todo: future refactor, consider a better home for errors,
//  but should still try to make them relevant to specific areas
export const UploadErrorMessages = {
  FILE_NOT_FOUND: 'File could not be found',
  ADDITIONAL_FILE_FOUND: 'File not declared in CSV',
  UNEXPECTED_ERROR: 'An unexpected error has occurred.',
  PERMISSIONS_REQUIRED:
    'Either you do not have uploader permissions in any organisation, or your permissions could not be properly loaded. Please contact an admin.',
  FILEPATH_PARSING_FAILED: 'An error occurred while parsing filepath',
  INVALID_SEQ_ID: 'Invalid Seq_ID',
  INVALID_FILE_CONTENT: 'Invalid File Content',
};
