import {
  CheckCircleOutlined,
  Download,
  ErrorOutlineRounded,
  InsertDriveFile,
} from '@mui/icons-material';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../../app/ApiContext';
import { Theme } from '../../assets/themes/theme';
import LoadingState from '../../constants/loadingState';
import { logoUrl } from '../../constants/logoPaths';
import { ResponseType } from '../../constants/responseType';
import type { ProjectDocument } from '../../types/dtos';
import type { ResponseObject } from '../../types/responseObject.interface';
import { isoDateLocalDate } from '../../utilities/dateUtils';
import { downloadDocument, getDocument, previewDocument } from '../../utilities/resourceUtils';
import { FileIcon } from './FileIcon';

const PREVIEWABLE_EXTENSIONS = ['pdf', 'txt', 'html'];

function DocumentPreview() {
  const { abbreviation, documentId } = useParams();
  const [previewBlob, setPreviewBlob] = useState<string | null>(null);
  const [projectDocument, setProjectDocument] = useState<ProjectDocument | null>(null);
  const [getDetailsStatus, setGetDetailsStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [previewStatus, setPreviewStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [downloadingStatus, setDownloadingStatus] = useState<LoadingState>(LoadingState.IDLE);

  const { token } = useApi();

  const canPreviewFileByExtension = (document: ProjectDocument) => {
    if (!document) return false;
    const filename = document.fileName;
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext ? PREVIEWABLE_EXTENSIONS.includes(ext) : false;
  };

  const previewErrorIcon = () => {
    return (
      <Box sx={{ position: 'relative', width: 48, height: 48 }}>
        <InsertDriveFile sx={{ width: 48, height: 48 }} color="error" />
        <ErrorOutlineRounded
          color="error"
          sx={{
            position: 'absolute',
            bottom: -5,
            right: -5,
            width: 24,
            height: 24,
            backgroundColor: 'white',
            borderRadius: '50%',
          }}
        />
      </Box>
    );
  };

  useEffect(() => {
    if (!token) return;
    let url: string;
    const handleGetDetails = async () => {
      setGetDetailsStatus(LoadingState.LOADING);

      try {
        const response: ResponseObject = await getDocument(
          abbreviation!,
          Number(documentId),
          token,
        );
        if (response.status === ResponseType.Success) {
          setProjectDocument(response.data as ProjectDocument);
          setGetDetailsStatus(LoadingState.SUCCESS);
        } else {
          setGetDetailsStatus(LoadingState.ERROR);
        }
      } catch {
        setGetDetailsStatus(LoadingState.ERROR);
      }
    };

    const handlePreview = async () => {
      setPreviewStatus(LoadingState.LOADING);
      try {
        const { blob } = await previewDocument(abbreviation!, Number(documentId), token);
        url = URL.createObjectURL(blob);
        const noToolBarUrl = `${url}#toolbar=0`;
        setPreviewBlob(noToolBarUrl);
        setPreviewStatus(LoadingState.SUCCESS);
      } catch {
        setPreviewStatus(LoadingState.ERROR);
      }
    };

    handlePreview();
    handleGetDetails();

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [abbreviation, documentId, token]);

  const handleDownload = async () => {
    setDownloadingStatus(LoadingState.LOADING);
    if (!previewBlob) {
      // If preview failed we should still allow downloading of file directly
      const { blob, suggestedFilename } = await downloadDocument(
        abbreviation!,
        Number(documentId),
        token,
      );

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = suggestedFilename;
      link.click();

      URL.revokeObjectURL(blobUrl);
      link.remove();
      setDownloadingStatus(LoadingState.SUCCESS);
      // Reset the download state after 3 seconds
      setTimeout(() => {
        setDownloadingStatus(LoadingState.IDLE);
      }, 3000);
    } else {
      const link = document.createElement('a');
      link.href = previewBlob;
      link.download = projectDocument?.fileName || 'document';
      link.click();
      setDownloadingStatus(LoadingState.SUCCESS);
      // Reset the download state after 3 seconds
      setTimeout(() => {
        setDownloadingStatus(LoadingState.IDLE);
      }, 3000);
    }
  };

  const downloadButton = (variant: 'contained' | 'outlined' = 'contained') => {
    if (downloadingStatus === LoadingState.LOADING) {
      return (
        <Button
          variant={variant}
          disabled
          startIcon={<CircularProgress size={20} />}
          sx={{ textTransform: 'none' }}
        >
          Downloading...
        </Button>
      );
    }
    if (downloadingStatus === LoadingState.SUCCESS) {
      return (
        <Button
          variant={variant}
          startIcon={<CheckCircleOutlined />}
          sx={{ textTransform: 'none', color: variant === 'outlined' ? 'success.main' : null }}
          color="success"
        >
          Downloaded
        </Button>
      );
    }
    return (
      <Button
        onClick={handleDownload}
        variant={variant}
        startIcon={<Download />}
        sx={{ textTransform: 'none' }}
      >
        Download
      </Button>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {getDetailsStatus === LoadingState.SUCCESS && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${Theme.PrimaryGrey300}`,
            gap: 2,
            padding: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Link to="/" aria-label="Go to home">
              <img src={logoUrl} alt="at-logo" height="45px" />
            </Link>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography color="primary" variant="body2" sx={{ fontWeight: 'bold' }}>
                {projectDocument?.fileName || 'document'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Created by {projectDocument?.createdBy || 'Unknown'} ·{' '}
                {projectDocument
                  ? isoDateLocalDate(projectDocument?.uploadedDate.toString())
                  : 'Unknown'}
              </Typography>
            </Box>
          </Box>
          {downloadButton('outlined')}
        </Box>
      )}

      {previewStatus === LoadingState.SUCCESS &&
        previewBlob &&
        canPreviewFileByExtension(projectDocument!) && (
          <iframe
            title="Document preview"
            src={previewBlob}
            style={{ height: '100%', border: 'none' }}
          />
        )}
      {previewStatus === LoadingState.LOADING && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <CircularProgress />
          <Typography variant="h4" sx={{ marginTop: 2, color: Theme.PrimaryMain }}>
            Loading file preview
          </Typography>
        </Box>
      )}
      {previewStatus === LoadingState.ERROR &&
        getDetailsStatus === LoadingState.SUCCESS &&
        projectDocument && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '80%',
            }}
          >
            {canPreviewFileByExtension(projectDocument) ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Typography variant="h4" color="error">
                  Failed to load file preview.
                </Typography>
              </Box>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  <FileIcon filename={projectDocument.fileName} size={72} />
                </div>
                <Typography variant="h4" color="primary">
                  Preview not available for this file type.
                </Typography>
                <Typography variant="subtitle2" color="primary" sx={{ marginBottom: 2 }}>
                  Please download the file to view it.
                </Typography>
                {downloadButton()}
              </>
            )}
          </Box>
        )}
      {getDetailsStatus === LoadingState.ERROR && previewStatus === LoadingState.ERROR && (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${Theme.PrimaryGrey300}`,
              paddingLeft: 1,
              paddingTop: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <Link to="/" aria-label="Go to home">
                <img src={logoUrl} alt="at-logo" height="45px" />
              </Link>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '80%',
            }}
          >
            {previewErrorIcon()}
            <Typography variant="h4" color="error" sx={{ marginTop: 2 }}>
              Failed to load document preview
            </Typography>
            <Typography variant="subtitle2" color={Theme.PrimaryGrey800}>
              There has been an error loading the document preview.
            </Typography>
            <Typography variant="subtitle2" color={Theme.PrimaryGrey800}>
              Please contact {import.meta.env.VITE_BRANDING_NAME} Support if the issue persists.
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
}

export default DocumentPreview;
