import { Edit, Save } from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { useEffect, useState } from 'react';
import { useApi } from '../../app/ApiContext';
import { Theme } from '../../assets/themes/theme';
import LoadingState from '../../constants/loadingState';
import { ResponseType } from '../../constants/responseType';
import type { ProjectDocument } from '../../types/dtos';
import { updateDocument } from '../../utilities/resourceUtils';
import {
  checkFilename,
  sanitizeFileDescription,
  sanitizeFilename,
} from '../../utilities/uploadUtils';
import DocumentResponseDialog from './DocumentResponseDialog';

interface EditDocumentDetailsProps {
  open: boolean;
  onClose: () => void;
  activeDocument: ProjectDocument;
  abbreviation: string;
  refresh: () => Promise<void>;
}

function EditDocumentDetails(props: EditDocumentDetailsProps) {
  const { open, onClose, activeDocument, abbreviation, refresh } = props;
  const { token } = useApi();
  const safeFileName = activeDocument?.fileName || '';
  const safeDescription = activeDocument?.description || '';
  const [filenameBase, setFilenameBase] = useState('');
  const [extension, setExtension] = useState<string | null>(null);
  const [fileDescription, setFileDescription] = useState(safeDescription);
  const [fileNameInputError, setFileNameInputError] = useState(false);
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);

  useEffect(() => {
    // Split filename into base and extension
    const getBaseAndExt = (fileName: string) => {
      const lastDot = fileName.lastIndexOf('.');
      if (lastDot > 0) {
        return [fileName.substring(0, lastDot), fileName.substring(lastDot)];
      }
      return [fileName, ''];
    };
    const [base, ext] = getBaseAndExt(safeFileName);
    setFilenameBase(base);
    setExtension(ext);
  }, [safeFileName]);

  useEffect(() => {
    setFileNameInputError(!checkFilename(filenameBase));
  }, [filenameBase]);

  const handleEdit = async () => {
    if (!activeDocument) return;
    try {
      // Sanitize filename base input and file description
      const sanitizedFilenameBase = sanitizeFilename(filenameBase);
      const sanitizedFileDescription = sanitizeFileDescription(fileDescription);

      // Only call endpoint if filename or description has changed
      if (
        sanitizedFilenameBase === sanitizeFilename(activeDocument.fileName) &&
        sanitizedFileDescription === sanitizeFileDescription(activeDocument.description)
      ) {
        onClose();
        return;
      }

      setStatus(LoadingState.LOADING);
      // Only send the filename base (no extension)
      const response = await updateDocument(
        abbreviation,
        activeDocument.id,
        token,
        sanitizedFilenameBase,
        sanitizedFileDescription,
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
  };

  const getFilenameHelperText = () => {
    const charCountText = `${filenameBase.length}/100`;
    return (
      <Box
        component="span"
        sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}
      >
        <span>{fileNameInputError ? 'Invalid characters included' : ''}</span>
        <span>{charCountText}</span>
      </Box>
    );
  };

  return (
    <>
      {status === LoadingState.IDLE || status === LoadingState.LOADING ? (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
          <DialogTitle>
            <Edit fontSize="large" color="primary" />
            <Typography color="primary" variant="h4" sx={{ marginBottom: 1 }}>
              Edit document details
            </Typography>
          </DialogTitle>
          <DialogContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEdit();
              }}
            >
              <TextField
                value={filenameBase}
                label="Filename"
                variant="filled"
                onChange={(e) => {
                  const { value } = e.target;
                  setFilenameBase(value);
                }}
                helperText={getFilenameHelperText()}
                error={fileNameInputError}
                required
                fullWidth
                slotProps={{
                  htmlInput: { maxLength: 100 },
                  formHelperText: { sx: { textAlign: 'right' } },
                  input: {
                    endAdornment: extension ? (
                      <InputAdornment position="end">
                        <Chip label={extension} size="small" sx={{ color: Theme.PrimaryGrey600 }} />
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
                onChange={(e) => setFileDescription(e.target.value)}
                required
                fullWidth
                multiline
                maxRows={4}
                sx={{ marginBottom: 1 }}
                helperText={`${fileDescription.length}/500`}
                slotProps={{
                  htmlInput: { maxLength: 500 },
                  formHelperText: { sx: { textAlign: 'right' } },
                }}
              />
            </form>
          </DialogContent>
          <DialogActions>
            <Button color="primary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleEdit}
              disabled={
                fileDescription.trim() === '' ||
                filenameBase.trim() === '' ||
                fileNameInputError ||
                status === LoadingState.LOADING ||
                (filenameBase === safeFileName && fileDescription === safeDescription)
              }
              startIcon={
                status === LoadingState.LOADING ? <CircularProgress size={20} /> : <Save />
              }
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      ) : null}
      {/* Error or success dialog */}
      {status === LoadingState.SUCCESS || status === LoadingState.ERROR ? (
        <DocumentResponseDialog
          open={true}
          onClose={() => onClose()}
          status={status === LoadingState.SUCCESS ? 'success' : 'error'}
          message={
            status === LoadingState.SUCCESS
              ? 'Document details updated successfully'
              : 'An error occurred while updating the document details'
          }
        />
      ) : null}
    </>
  );
}

export default EditDocumentDetails;
