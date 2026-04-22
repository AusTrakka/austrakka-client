import { DeleteOutline } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useApi } from '../../app/ApiContext';
import LoadingState from '../../constants/loadingState';
import { ResponseType } from '../../constants/responseType';
import type { ProjectDocument } from '../../types/dtos';
import { disableDocument } from '../../utilities/resourceUtils';
import DocumentResponseDialog from './DocumentResponseDialog';
import { FileIcon } from './FileIcon';

interface DeleteDocumentProps {
  open: boolean;
  onClose: () => void;
  refreshDocuments: () => Promise<void>;
  activeDocument: ProjectDocument;
  projectAbbrev: string;
}

function DeleteDocument(props: DeleteDocumentProps) {
  const { open, onClose, activeDocument, refreshDocuments, projectAbbrev } = props;
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  const { token } = useApi();

  const handleDelete = async (projectDoc: ProjectDocument) => {
    setStatus(LoadingState.LOADING);
    if (!projectDoc) return;
    try {
      const response = await disableDocument(projectAbbrev!, projectDoc.id, token);
      if (response.status === ResponseType.Success) {
        await refreshDocuments();
      }
      setStatus(LoadingState.SUCCESS);
    } catch {
      setStatus(LoadingState.ERROR);
    }
  };

  return (
    <>
      {status === LoadingState.IDLE || status === LoadingState.LOADING ? (
        <Dialog open={open} onClose={onClose}>
          <DialogTitle>
            <DeleteOutline fontSize="large" color="primary" />
            <Typography color="primary" sx={{ marginBottom: 1, fontWeight: 'bold' }}>
              Delete document
            </Typography>
            <Typography variant="body2" sx={{ marginBottom: 1 }}>
              Are you sure you want to delete this document?
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                padding: 1,
              }}
            >
              <FileIcon filename={activeDocument?.fileName ?? ''} size={18} />
              <Typography variant="body2" fontWeight="bold">
                {activeDocument?.fileName}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ padding: 2 }}>
            <Button color="primary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                handleDelete(activeDocument);
              }}
              startIcon={
                status === LoadingState.LOADING ? (
                  <CircularProgress color="inherit" size={20} />
                ) : (
                  <DeleteOutline />
                )
              }
            >
              Delete
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
              ? 'Document deleted successfully'
              : 'An error occurred while deleting the document'
          }
        />
      ) : null}
    </>
  );
}

export default DeleteDocument;
