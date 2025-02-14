import React, {DragEvent, useState, useRef, ChangeEvent, SetStateAction, Dispatch} from 'react';
import {Box, Button, Stack, Typography} from '@mui/material';
import {UploadFile} from '@mui/icons-material';
import theme from '../../assets/themes/theme';
import {DropFileUpload} from "../../types/DropFileUpload";
import {generateHash} from "../../utilities/file";
import {useSnackbar} from "notistack";
import {CustomUploadValidator} from "../../utilities/uploadUtils";

// The defaulting isn't working like I would have hoped
interface FileDragDropProps {
  files: DropFileUpload[],
  setFiles: Dispatch<SetStateAction<DropFileUpload[]>>,
  validFormats: object,
  multiple: boolean,
  calculateHash: boolean,
  customValidators: CustomUploadValidator[],
}

const FileDragDrop2: React.FC<FileDragDropProps> = (
  {
    files, 
    setFiles, 
    validFormats, // TODO: this hasn't been implemented
    multiple = false, 
    calculateHash = false,
    customValidators = []
  }
) => {
  const { enqueueSnackbar } = useSnackbar()
  const fileInputRef = useRef<null | HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const validateUpload = (uploadedFiles: File[]): boolean => {
    for (const validator of customValidators) {
      const validatorReturn = validator.func(uploadedFiles);
      if (!validatorReturn.success) {
        enqueueSnackbar(validatorReturn.message, { variant: "error"})
        console.error(validatorReturn.message)
        return false;
      }
    }
    return true;
  }

  const handleFiles = async (uploadedFiles: File[]) => {
    const fileUploads = await Promise.all(uploadedFiles.map(async file => {
      return {
        file: file,
        isValid: !Object.values(validFormats).includes(file?.type),
        hash: calculateHash ? await generateHash(await file.text()) : ''
      } as DropFileUpload
    }))
    setFiles([...files, ...fileUploads]);
    console.log("file length " + files.length)
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    const uploadedFiles = Array.from(e.dataTransfer?.files ?? [])
    if (!validateUpload(uploadedFiles)) {
      return
    }
    await handleFiles(uploadedFiles)
  };
  const onBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleBrowseChange = async (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const uploadedFiles = Array.from(e.target?.files ?? [])
    if (!validateUpload(uploadedFiles)) {
      return
    }
    await handleFiles(uploadedFiles)
  };
  return (
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
            {duration: theme.transitions.duration?.standard}
          )
        }}
      >
        <Stack spacing={2} justifyContent="center" alignItems="center">
          {files.length === 0 ? (
            <>
              <UploadFile fontSize="large" color="primary"/>
              <Typography variant="h5" color="primary">Drag and drop file here</Typography>
              <Typography variant="subtitle1">or</Typography>
              <Button variant="outlined" component="label">
                Browse
                <input
                  ref={fileInputRef}
                  type="file"
                  id="input-file-upload"
                  onClick={onBrowseClick}
                  multiple={multiple}
                  onChange={handleBrowseChange}
                  accept={Object.values(validFormats).toString()}
                  hidden/>
              </Button>
            </>
          ) : (
            <>
              {files.map((file, index) => (
                <div key={file.file.name}>
                  <Typography variant="subtitle1">File {index + 1}: {file.file.name}</Typography>
                </div>
              ))}
            </>
          )}
        </Stack>
      </Box>
    </>
  );
}

export default FileDragDrop2;

