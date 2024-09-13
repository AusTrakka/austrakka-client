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
  const [feedbackDto, setFeedbackDto] = useState({
    title: '',
    description: '',
    currentPage: '/',
  } as FeedbackPost);
  const formValid = useRef({
    title: false,
    description: false,
  });
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
      feedbackDto.currentPage = location.pathname;
      const feedbackResp = await postFeedback(feedbackDto, token);
      if (feedbackResp.status === ResponseType.Success) {
        setFeedbackMessage(`Feedback received. Ticket number: ${feedbackResp.data?.id}`);
        setToastSeverity('success');
        setFeedbackDto({
          ...feedbackDto,
          'title': '',
          'description': '',
        });
      } else {
        setFeedbackMessage(feedbackResp.message);
        setToastSeverity('error');
      }
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
    setFeedbackDto({
      ...feedbackDto,
      'title': e.target.value,
    });
    setTitleError(!e.target.validity.valid);
    formValid.current.title = e.target.validity.valid;
  };
  const formRef = useRef();

  const handleDescChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFeedbackDto({
      ...feedbackDto,
      'description': e.target.value,
    });
    setDescError(!e.target.validity.valid);
    formValid.current.description = e.target.validity.valid;
  };

  return (
    <>
      <Dialog
        open={help}
        onClose={handleHelpClose}
      >
        <Box ref={formRef} component="form" onSubmit={submitFeedback} noValidate>
          <DialogTitle>Feedback and Bug Reports</DialogTitle>
          <DialogContent>
            <DialogContentText variant="subtitle2">
              Use this form to to submit bug reports or general feedback directly to the AusTrakka
              team. The current page you are on will also be submitted.
            </DialogContentText>
            <Stack direction="column" paddingY={2} spacing={3}>
              <Divider orientation="horizontal" flexItem />
            <TextField
              autoFocus
              required
              value={feedbackDto.title}
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
              value={feedbackDto.description}
              onChange={handleDescChange}
              error={descError}
              helperText={descError ? 'Please enter a description' : ''}
            />
          </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => handleHelpClose({ undefined }, 'backdropClick')}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={tokenLoading === LoadingState.LOADING || tokenLoading === LoadingState.IDLE}
              color='primary'
              variant='contained'
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
