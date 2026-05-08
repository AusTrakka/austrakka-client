import { AddBox, Upload } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2 as Grid,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useApi } from '../../app/ApiContext';
import { Theme } from '../../assets/themes/theme';
import LoadingState from '../../constants/loadingState';
import { ResponseType } from '../../constants/responseType';
import type { DropFileUpload } from '../../types/DropFileUpload';
import { uploadDocument } from '../../utilities/resourceUtils';
import {
  checkFilename,
  sanitizeFileDescription,
  sanitizeFilename,
} from '../../utilities/uploadUtils';
import FileDragDrop from '../Upload/FileDragDrop';
import DocumentResponseToast from './DocumentResponseToast';
import { MAX_FILE_DESCRIPTION_LENGTH, MAX_FILENAME_LENGTH } from './ProjectDocuments';

const VALID_FILE_UPLOAD_TYPES = {
  '.csv': 'text/csv',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.html': 'text/html',
};

interface UploadDocumentProps {
  open: boolean;
  onClose: () => void;
  abbreviation: string;
  refresh: () => Promise<void>;
}

function UploadDocument(props: UploadDocumentProps) {
  const { open, onClose, abbreviation, refresh } = props;
  const [file, setFile] = useState<DropFileUpload[]>([]);
  const [filenameBase, setFilenameBase] = useState('');
  const [extension, setExtension] = useState<string | null>(null);
  const [fileDescription, setFileDescription] = useState('');
  const prevFileLengthRef = useRef(file.length);
  const filenameBaseRef = useRef(filenameBase);
  const [fileNameInputError, setFileNameInputError] = useState(false);
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);

  const { token, tokenLoading } = useApi();

  const handleUpload = async () => {
    if (
      tokenLoading !== LoadingState.LOADING &&
      tokenLoading !== LoadingState.IDLE &&
      file.length > 0
    ) {
      try {
        setStatus(LoadingState.LOADING);
        // Sanitize filename base input and file description
        const sanitizedFilenameBase = sanitizeFilename(filenameBase);
        const sanitizedFileDescription = sanitizeFileDescription(fileDescription);

        const formData = new FormData();
        formData.append('file', file[0].file!);
        const response = await uploadDocument(
          abbreviation,
          sanitizedFilenameBase + extension,
          sanitizedFileDescription,
          formData,
          token,
        );
        if (response.status === ResponseType.Success) {
          await refresh();
          setStatus(LoadingState.SUCCESS);
        } else {
          setStatus(LoadingState.ERROR);
        }
      } catch {
        setStatus(LoadingState.ERROR);
      }
    } else {
      setStatus(LoadingState.ERROR);
    }
  };

  useEffect(() => {
    filenameBaseRef.current = filenameBase;
  }, [filenameBase]);

  useEffect(() => {
    if (file.length > 0) {
      const uploadedFile = file[0].file;
      const nameParts = uploadedFile.name.split('.');

      if (filenameBaseRef.current.trim() === '') {
        // If filename field is empty, set both base and extension
        if (nameParts.length > 1) {
          setExtension(`.${nameParts.pop()}`);
          setFilenameBase(`${nameParts.shift()}`);
        } else {
          setExtension(null);
        }
      } else if (filenameBaseRef.current.trim() !== '') {
        // If filename is not empty, just set the extension
        const [uploadedFile] = file;
        const nameParts = uploadedFile.file.name.split('.');
        if (nameParts.length > 1) {
          setExtension(`.${nameParts.pop()}`);
        } else {
          setExtension(null);
        }
      } else {
        setExtension(null);
      }
    }
    if (file.length === 0 && prevFileLengthRef.current > 0) {
      setFilenameBase('');
      setExtension(null);
      setFileDescription('');
    }
    prevFileLengthRef.current = file.length;
  }, [file]);

  const getFilenameHelperText = () => {
    const charCountText = `${filenameBase.length + (extension ? extension.length : 0)}/${MAX_FILENAME_LENGTH}`;
    return (
      <Box
        component="span"
        sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}
      >
        <span>{fileNameInputError ? 'Invalid characters included' : ''}</span>
        <Tooltip title="Includes file extension" placement="top" arrow>
          <span>{charCountText}</span>
        </Tooltip>
      </Box>
    );
  };

  return (
    <>
      {status === LoadingState.IDLE || status === LoadingState.LOADING ? (
        <Dialog open={open} sx={{ minWidth: 350 }}>
          <DialogTitle>
            <AddBox fontSize="large" color="primary" />
            <Typography variant="h4" color="primary" sx={{ marginBottom: 1 }}>
              Upload new document
            </Typography>
            <Typography variant="body2">
              Select a new <b>approved</b> project document to upload. Please ensure that the file
              content is appropriate, and that a clear filename and description are provided.
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  value={filenameBase}
                  label="Filename"
                  helperText={getFilenameHelperText()}
                  variant="filled"
                  onChange={(e) => {
                    const { value } = e.target;
                    setFilenameBase(value);
                    setFileNameInputError(!checkFilename(value));
                  }}
                  error={fileNameInputError}
                  required
                  fullWidth
                  slotProps={{
                    htmlInput: {
                      maxLength: MAX_FILENAME_LENGTH - (extension ? extension.length : 0),
                    },
                    formHelperText: { sx: { textAlign: 'right' } },
                    input: {
                      endAdornment: extension ? (
                        <InputAdornment position="end">
                          <Chip
                            label={extension}
                            size="small"
                            sx={{ color: Theme.PrimaryGrey600 }}
                          />
                        </InputAdornment>
                      ) : null,
                      style: {
                        lineHeight: 1.5,
                        height: 'auto',
                        alignItems: 'center',
                        display: 'flex',
                      },
                    },
                  }}
                  sx={{
                    marginBottom: 1,
                    display: 'flex',
                    '& .MuiInputBase-input': { flex: 1, minWidth: 0 },
                  }}
                />
                <TextField
                  label="Description"
                  type="text"
                  variant="filled"
                  value={fileDescription}
                  helperText={`${fileDescription.length}/${MAX_FILE_DESCRIPTION_LENGTH}`}
                  onChange={(e) => setFileDescription(e.target.value)}
                  required
                  fullWidth
                  multiline
                  maxRows={4}
                  slotProps={{
                    htmlInput: { maxLength: MAX_FILE_DESCRIPTION_LENGTH },
                    formHelperText: { sx: { textAlign: 'right' } },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FileDragDrop
                  files={file}
                  setFiles={setFile}
                  validFormats={VALID_FILE_UPLOAD_TYPES}
                  multiple={false}
                  maxFileSize={209715200} // 200MB in bytes
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button color="primary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleUpload}
              disabled={
                file.length === 0 ||
                filenameBase.trim().length === 0 ||
                fileDescription.trim().length === 0 ||
                fileNameInputError ||
                status === LoadingState.LOADING
              }
              startIcon={
                status === LoadingState.LOADING ? (
                  <CircularProgress color="inherit" size={20} />
                ) : (
                  <Upload />
                )
              }
            >
              Upload
            </Button>
          </DialogActions>
        </Dialog>
      ) : null}
      {/* Error or success toast */}
      {status === LoadingState.SUCCESS || status === LoadingState.ERROR ? (
        <DocumentResponseToast
          open={true}
          onClose={() => onClose()}
          status={status === LoadingState.SUCCESS ? 'success' : 'error'}
          message={
            status === LoadingState.SUCCESS
              ? 'Document uploaded successfully'
              : 'An error occurred while uploading the document'
          }
        />
      ) : null}
    </>
  );
}

export default UploadDocument;
