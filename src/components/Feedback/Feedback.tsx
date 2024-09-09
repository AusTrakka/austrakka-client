import React, {ChangeEvent, useRef, useState} from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  DialogContentText,
  Button, 
  Box, 
  Snackbar, 
  Alert,
} from '@mui/material'
import {FeedbackPost} from "../../types/dtos";
import {postFeedback} from "../../utilities/resourceUtils";
import {useApi} from "../../app/ApiContext";
import {Location} from "react-router-dom";

interface FeedbackProps {
  help: boolean;
  handleHelpClose: ((event: {}, reason: "backdropClick" | "escapeKeyDown") => void);
  location: Location<any>;
}

function Feedback(props: FeedbackProps) {
  const { token, tokenLoading } = useApi();
  const [feedbackDto, setFeedbackDto] = useState({
    title: "",
    description: "",
    currentPage: props.location.pathname,
  } as FeedbackPost)
  const formValid = useRef({
    title: false,
    description: false,
  })
  const [titleError, setTitleError] = useState(false);
  const [descError, setDescError] = useState(false);
  const [feedbackId, setFeedbackId] = useState("");
  const [successToast, setSuccessToast] = useState<boolean>(false);
  const handleToastClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      setSuccessToast(false);
      return;
    }
    setSuccessToast(false);
  };
  const submitFeedback = async (e: any) => {
    e.preventDefault();
    if (Object.values(formValid.current).every(isValid => isValid)) {
      const feedbackResp = await postFeedback(feedbackDto, token)
      setFeedbackId(feedbackResp.data?.id ?? "");
      console.log(feedbackResp.message);
      setFeedbackDto({
        ...feedbackDto,
        ["title"]: "",
        ["description"]: "",
      })
      props.handleHelpClose({}, "escapeKeyDown");
      setSuccessToast(true);
    } else {
      if (!formValid.current.title) {
        setTitleError(true)  
      }
      if (!formValid.current.description) {
        setDescError(true)
      }
    }
  }
  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFeedbackDto({
      ...feedbackDto,
      ["title"]: e.target.value
    });
    setTitleError(!e.target.validity.valid)
    formValid.current.title = e.target.validity.valid;
  };
  const formRef = useRef();


  const handleDescChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFeedbackDto({
      ...feedbackDto,
      ["description"]: e.target.value
    });
    setDescError(!e.target.validity.valid)
    formValid.current.description = e.target.validity.valid;
  };

  return (
    <React.Fragment>
      <Dialog
          open={props.help}
          onClose={props.handleHelpClose}
      >
        <Box ref={formRef} component="form" onSubmit={submitFeedback} noValidate>
          <DialogTitle>Feedback and Bug Reports</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Use this form to to submit bug reports or general feedback directly to the AusTrakka team. The current page you are on will also be submitted.
            </DialogContentText>
            <TextField
                autoFocus
                required
                value={feedbackDto.title}
                onChange={handleTitleChange}
                error={titleError}
                helperText={titleError ? "Please enter a title" : ""}
                margin="dense"
                id="feedback-title"
                name="title"
                label="Title"
                fullWidth
                variant="standard"
            />
            <TextField
                id="feedback-description"
                label="Description"
                multiline
                rows={4}
                variant="standard"
                fullWidth
                required
                value={feedbackDto.description}
                onChange={handleDescChange}
                error={descError}
                helperText={descError ? "Please enter a description" : ""}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => props.handleHelpClose({undefined}, "backdropClick")}>Cancel</Button>
            <Button type="submit">Submit</Button>
          </DialogActions>
        </Box>
      </Dialog>
      <Snackbar
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          open={successToast}
          autoHideDuration={6000}
          onClose={handleToastClose}
      >
        <Alert onClose={handleToastClose} severity="success">
          Feedback received. ID: {feedbackId}
        </Alert>
      </Snackbar>
    </React.Fragment>
  )
}

export default Feedback;
