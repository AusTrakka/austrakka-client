import React, { ReactElement, useState } from 'react';
import {
  Alert,
  AlertColor,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { ResponseMessage } from '../../types/apiResponse.interface';
import { ResponseType } from '../../constants/responseType';

interface ValidationProps {
  messages: ResponseMessage[],
  title: string,
  showTitle: boolean,
}

interface ValidationModalProps {
  messages: ResponseMessage[],
  title: string,
  openModal: boolean,
  handleModalClose: ((event: {}, reason: 'backdropClick' | 'escapeKeyDown') => void)
}

interface ValidationPopupProps {
  messages: ResponseMessage[],
  title: string,
  disabled: boolean,
}

function getIcon(messages: ResponseMessage[]): ReactElement {
  if (messages.some(m => m.ResponseType === ResponseType.Error)) {
    return <ErrorOutlineOutlinedIcon />;
  }
  if (messages.some(m => m.ResponseType === ResponseType.Warning)) {
    return <WarningAmberOutlinedIcon />;
  }
  return <CheckCircleOutlineOutlinedIcon />;
}

function getColor(messages: ResponseMessage[]): 'error' | 'warning' | 'success' {
  if (messages.some(m => m.ResponseType === ResponseType.Error)) {
    return 'error';
  }
  if (messages.some(m => m.ResponseType === ResponseType.Warning)) {
    return 'warning';
  }
  return 'success';
}

export function Validation(props: ValidationProps) {
  const { messages, title, showTitle } = props;

  return (
    <>
      {showTitle && (<Typography variant="h4" color="primary">{title}</Typography>)}
      <Stack direction="column" spacing={1}>
        {messages.map(
          (message: ResponseMessage) => (
            <Alert
              key={message.ResponseMessage}
              severity={message.ResponseType.toLowerCase() as AlertColor}
            >
              <strong>{message.ResponseType}</strong>
              {' '}
              -
              {' '}
              {message.ResponseMessage}
            </Alert>
          ),
        )}
      </Stack>
    </>
  );
}

export function ValidationModal(props: ValidationModalProps) {
  const {
    messages,
    title,
    openModal,
    handleModalClose,
  } = props;
  return (
    <Dialog
      open={openModal}
      onClose={handleModalClose}
    >
      <Box>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Validation
            messages={messages}
            title={title}
            showTitle={false}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => handleModalClose({ undefined }, 'backdropClick')}
          >
            Close
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export function ValidationPopupButton(props: ValidationPopupProps) {
  const {
    messages,
    title,
    disabled,
  } = props;
  const [showValidation, setShowValidation] = useState(false);
  return (
    <>
      <Button
        startIcon={getIcon(messages)}
        size="small"
        variant="outlined"
        color={getColor(messages)}
        onClick={() => {
          setShowValidation(!showValidation);
        }}
        disabled={disabled}
      >
        Show Response
      </Button>
      <ValidationModal
        messages={messages}
        title={title}
        openModal={showValidation}
        handleModalClose={() => setShowValidation(!showValidation)}
      />
    </>
  );
}
