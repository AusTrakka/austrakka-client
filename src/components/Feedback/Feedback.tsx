import React, { ChangeEvent, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  TextField,
  AlertColor,
  Stack,
  Divider,
} from '@mui/material';
import { Location } from 'react-router-dom';
import { FeedbackPost } from '../../types/dtos';
import { postFeedback } from '../../utilities/resourceUtils';
import { useApi } from '../../app/ApiContext';
import { ResponseType } from '../../constants/responseType';
import LoadingState from '../../constants/loadingState';

interface FeedbackProps {
  help: boolean;
  handleHelpClose: ((event: {}, reason: 'backdropClick' | 'escapeKeyDown') => void);
  location: Location<any>;
}

function Feedback(props: FeedbackProps) {
  const {
    help,
    handleHelpClose,
    location,
  } = props;
  const { token, tokenLoading } = useApi();
  const formValid = useRef({
    title: false,
    description: false,
  });
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleError, setTitleError] = useState(false);
  const [descError, setDescError] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<AlertColor>('success');
  const [toast, setToast] = useState<boolean>(false);
  const handleToastClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      setToast(false);
      return;
    }
    setToast(false);
  };
  const submitFeedback = async (e: any) => {
    e.preventDefault();
    if (Object.values(formValid.current).every(isValid => isValid)) {
      const feedbackDto: FeedbackPost = {
        title,
        description,
        currentPage: location.pathname,
      };
      const feedbackResp = await postFeedback(feedbackDto, token);
      if (feedbackResp.status === ResponseType.Success) {
        setFeedbackMessage(`Feedback received. Ticket number: ${feedbackResp.data?.id}`);
        setToastSeverity('success');
        setTitle('');
        setDescription('');
      } else {
        setFeedbackMessage(feedbackResp.message);
        setToastSeverity('error');
      }
      formValid.current.description = false;
      formValid.current.title = false;
      handleHelpClose({}, 'escapeKeyDown');
      setToast(true);
    } else {
      if (!formValid.current.title) {
        setTitleError(true);
      }
      if (!formValid.current.description) {
        setDescError(true);
      }
    }
  };
  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setTitleError(!e.target.validity.valid);
    formValid.current.title = e.target.validity.valid;
  };
  const formRef = useRef();

  const handleDescChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
    setDescError(!e.target.validity.valid);
    formValid.current.description = e.target.validity.valid;
  };

  const cancelFeedback = () => {
    setTitle('');
    setDescription('');
    handleHelpClose({ undefined }, 'backdropClick');
  };

  return (
    <>
      <Dialog
        open={help}
        onClose={handleHelpClose}
      >
        <Box ref={formRef} component="form" onSubmit={submitFeedback} noValidate>
          <DialogTitle>Support Requests</DialogTitle>
          <DialogContent>
            <DialogContentText variant="subtitle2">
              Use this form to submit bug reports, support requests, or general feedback directly to the AusTrakka
              team. The current page you are on will also be submitted.
            </DialogContentText>
            <Stack direction="column" paddingY={2} spacing={3}>
              <Divider orientation="horizontal" flexItem />
              <TextField
                autoFocus
                required
                value={title}
                onChange={handleTitleChange}
                error={titleError}
                helperText={titleError ? 'Please enter a title' : ''}
                margin="dense"
                id="feedback-title"
                name="title"
                label="Title"
                fullWidth
                variant="filled"
              />
              <TextField
                id="feedback-description"
                label="Description"
                multiline
                rows={4}
                variant="filled"
                fullWidth
                required
                value={description}
                onChange={handleDescChange}
                error={descError}
                helperText={descError ? 'Please enter a description' : ''}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={cancelFeedback}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={tokenLoading === LoadingState.LOADING || tokenLoading === LoadingState.IDLE}
              color="primary"
              variant="contained"
            >
              Submit
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={toast}
        autoHideDuration={10000}
      >
        <Alert onClose={handleToastClose} severity={toastSeverity}>
          {feedbackMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

export default Feedback;
