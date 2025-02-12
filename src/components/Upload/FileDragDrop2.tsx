import React, {DragEvent, useState, useRef, ChangeEvent, SetStateAction, Dispatch} from 'react';
import {Box, Button, Stack, Typography} from '@mui/material';
import {UploadFile} from '@mui/icons-material';
import theme from '../../assets/themes/theme';
import {DropFileUpload} from "../../types/DropFileUpload";
import {generateHash} from "../../utilities/file";

interface FileDragDropProps {
  files: DropFileUpload[],
  setFiles: Dispatch<SetStateAction<DropFileUpload[]>>,
  validFormats: object,
  multiple: boolean,
  maxFiles: number,
}

// TODO: merge this with FileDragDrop if possible
// @ts-ignore
const FileDragDrop2: React.FC<FileDragDropProps> = (
  {files, setFiles, validFormats, multiple = false, maxFiles = 0}
) => {
  const fileInputRef = useRef<null | HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const maxFilesReached = (filesDropped: number): boolean => {
    // This does not need to handle the case where multiple is false.
    if (multiple && maxFiles == 0) {
      return false;
    } else if (filesDropped > maxFiles) {
      return true;
    }
    return false;
  }

  const handleFiles = async (uploadedFiles: File[]) => {
    const fileUploads = await Promise.all(uploadedFiles.map(async file => {
      return {
        file: file,
        isValid: !Object.values(validFormats).includes(file?.type),
        hash: await generateHash(await file.text())
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
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (maxFilesReached(e.dataTransfer?.files?.length ?? 0)) {
      console.log(`Only ${maxFiles} files accepted.`)
      return
    }
    handleFiles(Array.from(e.dataTransfer?.files ?? []))
  };
  const onBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleBrowseChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (maxFilesReached(e.target?.files?.length ?? 0)) {
      console.log(`Only ${maxFiles} files accepted.`)
      return
    }
    handleFiles(Array.from(e.target?.files ?? []))
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

