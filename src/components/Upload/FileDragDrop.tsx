import React, { DragEvent, useState, useEffect, useRef, ChangeEvent, SetStateAction, Dispatch, useCallback } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { AttachFile, UploadFile } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import theme from '../../assets/themes/theme';
import { DropFileUpload } from '../../types/DropFileUpload';
import { generateHash } from '../../utilities/file';
import { CustomUploadValidator, CustomUploadValidatorReturn } from '../../utilities/uploadUtils';

interface FileDragDropProps {
  files: DropFileUpload[],
  setFiles: Dispatch<SetStateAction<DropFileUpload[]>>,
  validFormats: Record<string, string>, // TODO when FASTA, must revalidate when this changes
  multiple?: boolean | undefined, // eslint-disable-line react/require-default-props
  calculateHash?: boolean | undefined, // eslint-disable-line react/require-default-props
  customValidators?: CustomUploadValidator[] | undefined, // eslint-disable-line react/require-default-props, max-len
  validated: boolean,
  setValidated: Dispatch<SetStateAction<boolean>>,
  disabled?:boolean,
}

// eslint-disable-next-line react/function-component-definition
const FileDragDrop: React.FC<FileDragDropProps> = (
  {
    files,
    setFiles,
    validFormats,
    multiple = false,
    calculateHash = false,
    customValidators = [],
    validated,
    setValidated,
    disabled,
  },
) => {
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef<null | HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  
  const textColour = disabled ? 'text.disabled' : 'primary';
  const iconColour = disabled ? 'disabled' : 'primary';
  
  const validateUpload = useCallback((uploadedFiles: File[]): boolean => {
    const validateFilesAreOfType = {
      func: (_files: File[]) => ({
        success: Object.entries(validFormats).length === 0 ||
          _files.every(f => Object.keys(validFormats).some(ex => f.name.endsWith(ex))),
        message: `All files must be of a valid format: ${Object.keys(validFormats).join(', ')}`,
      } as CustomUploadValidatorReturn),
    } as CustomUploadValidator;

    const validateSingleFile = {
      func: (_files: File[]) => ({
        success: _files.length === 1,
        message: 'Only one file can be selected',
      } as CustomUploadValidatorReturn),
    } as CustomUploadValidator;
    
    const getBuiltInValidators = (): CustomUploadValidator[] => {
      const validators: CustomUploadValidator[] = [];
      if (!multiple) {
        validators.push(validateSingleFile);
      }
      if (Object.entries(validFormats).length > 0) {
        validators.push(validateFilesAreOfType);
      }
      return validators;
    };
    
    for (const validator of [...getBuiltInValidators(), ...customValidators]) {
      const validatorReturn = validator.func(uploadedFiles);
      if (!validatorReturn.success) {
        enqueueSnackbar(validatorReturn.message, { variant: 'error', autoHideDuration: 8000 });
        setValidated(false);
        setFiles([]);
        return false;
      }
    }
    setValidated(true);
    return true;
  }, [customValidators, enqueueSnackbar, multiple, setFiles, setValidated, validFormats]);

  const handleFiles = async (uploadedFiles: File[]) => {
    const fileUploads = await Promise.all(uploadedFiles.map(async file => ({
      file,
      hash: calculateHash ? await generateHash(await file.arrayBuffer()) : undefined,
    } as DropFileUpload)));
    setFiles([...files, ...fileUploads]);
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) { return; }
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) { return; }
    
    const uploadedFiles = Array.from(e.dataTransfer?.files ?? []);
    if (!validateUpload(uploadedFiles)) {
      return;
    }
    await handleFiles(uploadedFiles);
  };
  const onBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleBrowseChange = async (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const uploadedFiles = Array.from(e.target?.files ?? []);
    if (!validateUpload(uploadedFiles)) {
      return;
    }
    await handleFiles(uploadedFiles);
  };
  
  const handleClearFiles = () => {
    setFiles([]);
  };

  useEffect(() => {
    if (files.length > 0 && !validated) {
      validateUpload(files.map(f => f.file));
    }
  }, [validated, validateUpload, setFiles, files]);

  return (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>
      <Box
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          p: 3,
          borderRadius: 2,
          backgroundColor: dragActive ? '' : 'var(--primary-main-bg)',
          marginTop: 2,
          marginBottom: 2,
          height: '100%',
          border: dragActive ? 4 : 0,
          borderColor: 'var(--primary-main-bg)',
          borderStyle: dragActive ? 'dashed' : 'solid',
          transition: theme.transitions?.create!(
            ['background-color', 'border'],
            { duration: theme.transitions.duration?.standard },
          ),
        }}
      >
        <Stack spacing={1} justifyContent="center" alignItems="center">
          {files.length === 0 ? (
            <>
              <UploadFile fontSize="large" color={iconColour} />
              <Typography variant="h5" color={textColour}>
                {multiple ? 'Drag and drop files here' : 'Drag and drop file here'}
              </Typography>
              <Typography variant="subtitle1" color={textColour}>or</Typography>
              <Button variant="outlined" component="label" disabled={disabled}>
                Browse
                <input
                  ref={fileInputRef}
                  type="file"
                  id="input-file-upload"
                  onClick={onBrowseClick}
                  multiple={multiple}
                  onChange={handleBrowseChange}
                  accept={[...new Set(Object.entries(validFormats).flat().filter(x => x !== ''))].join(',')}
                  hidden
                />
              </Button>
              {
                Object.entries(validFormats).length > 0 &&
                  (
                    <Typography variant="subtitle2" color={textColour}>
                      Valid file types are:
                      {' '}
                      {Object.keys(validFormats).join(', ')}
                    </Typography>
                  )
              }
            </>
          ) : (
            <>
              <AttachFile fontSize="large" color="primary" />
              <Typography
                variant="h5"
                color="primary"
              >
                {multiple ? 'Selected files:' : 'Selected file:'}
              </Typography>
              <>
                {files.map((file) => (
                  <div key={file.file.name}>
                    <Typography variant="subtitle1">
                      {file.file.name}
                    </Typography>
                  </div>
                ))}
              </>
              <Button
                variant="outlined"
                color="error"
                onClick={handleClearFiles}
              >
                Clear
              </Button>
            </>
          )}
        </Stack>
      </Box>
    </>
  );
};

export default FileDragDrop;
