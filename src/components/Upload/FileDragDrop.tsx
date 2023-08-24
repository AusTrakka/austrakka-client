import React, { DragEvent, useState, useRef, ChangeEvent } from 'react';
import { Alert, Box, Button, Grid, Typography } from '@mui/material';
import { AttachFile, UploadFile } from '@mui/icons-material';
import theme from '../../assets/themes/theme';

interface FileDragDropProps {
  file: any,
  setFile: any,
  invalidFile: boolean,
  setInvalidFile: any,
  validFormats: object,
}

function FileDragDrop(props: FileDragDropProps) {
  const { invalidFile, file, setFile, setInvalidFile, validFormats } = props;
  const fileInputRef = useRef<null | HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (uploadedFile: File) => {
    setFile(uploadedFile);
    if (!Object.values(validFormats).includes(uploadedFile?.type)) {
      setInvalidFile(true);
    } else {
      setInvalidFile(false);
    }
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  const onBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleBrowseChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <Box
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      sx={{ p: 3,
        borderRadius: 2,
        backgroundColor: dragActive ? '' : 'rgb(238, 242, 246)',
        marginTop: 2,
        marginBottom: 2,
        height: '100%',
        border: dragActive ? 4 : 0,
        borderColor: 'rgb(238, 242, 246)',
        borderStyle: dragActive ? 'dashed' : 'solid',
        transition: theme.transitions?.create!(
          ['background-color', 'border'],
          { duration: theme.transitions.duration?.standard },
        ) }}
    >
      <Grid container direction="column" justifyContent="center" alignItems="center" sx={{ height: '100%' }}>
        <Grid item>
          {file ? <AttachFile fontSize="large" color="primary" /> : <UploadFile fontSize="large" color="primary" />}
        </Grid>
        <Grid item>
          <Typography variant="h5" color="primary">{ file ? 'Selected file' : 'Drag and drop file here'}</Typography>
        </Grid>
        <Grid item>
          <Typography variant="subtitle1">{ file ? file && file.name : 'or' }</Typography>
        </Grid>
        <Grid item>
          {file ? (
            <Button variant="outlined" component="label" sx={{ m: 2 }} onClick={() => { setFile(null); setInvalidFile(false); }}>
              Remove
            </Button>
          )
            : (
              <Button variant="outlined" component="label">
                Browse
                <input
                  ref={fileInputRef}
                  type="file"
                  id="input-file-upload"
                  onClick={onBrowseClick}
                  multiple={false}
                  onChange={handleBrowseChange}
                  accept={Object.values(validFormats).toString()}
                  hidden
                />
              </Button>
            )}
        </Grid>
        <Grid item sx={{ marginTop: 2 }}>
          { invalidFile ? (
            <Alert variant="outlined" severity="error">
              Invalid file type. Valid file types are:
              {' '}
              {Object.keys(validFormats).join(', ')}
            </Alert>
          )
            : null }
        </Grid>
        { !file ? (
          <Typography variant="subtitle2">
            Valid file types are:
            {' '}
            {Object.keys(validFormats).join(', ')}
          </Typography>
        )
          : null }
      </Grid>
    </Box>
  );
}
export default FileDragDrop;
