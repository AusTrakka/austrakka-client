import {
  Box, Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import React, { ReactElement, useState } from 'react';
import { ResponseMessage } from '../../types/apiResponse.interface';
import Validation from './Validation';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { ResponseType } from '../../constants/responseType';

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

export default function ValidationModal(props: ValidationModalProps) {
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
        startIcon={GetIcon(messages)}
        size="small"
        variant="outlined"
        color={GetColor(messages)}
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
  )
}

function GetIcon(messages: ResponseMessage[]): ReactElement {
  if (messages.some(m => m.ResponseType == ResponseType.Error)) {
    return <ErrorOutlineOutlinedIcon />;
  }
  if (messages.some(m => m.ResponseType == ResponseType.Warning)) {
    return <WarningAmberOutlinedIcon />;
  }
  return <CheckCircleOutlineOutlinedIcon />;
}

function GetColor(messages: ResponseMessage[]): "error" | "warning" | "success" {
  if (messages.some(m => m.ResponseType == ResponseType.Error)) {
    return "error"
  }
  if (messages.some(m => m.ResponseType == ResponseType.Warning)) {
    return "warning"
  }
  return "success"
}
