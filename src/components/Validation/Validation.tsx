import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import {
  Alert,
  type AlertColor,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { type ReactElement, useState } from 'react';
import { ResponseType } from '../../constants/responseType';
import type { ResponseMessage } from '../../types/apiResponse.interface';

interface ValidationProps {
  messages: ResponseMessage[];
  title: string;
  showTitle: boolean;
}

interface ValidationModalProps {
  messages: ResponseMessage[];
  title: string;
  openModal: boolean;
  handleModalClose: (event: object, reason: 'backdropClick' | 'escapeKeyDown') => void;
}

interface ValidationPopupProps {
  messages: ResponseMessage[];
  title: string;
  disabled: boolean;
}

function getIcon(messages: ResponseMessage[]): ReactElement {
  if (messages.some((m) => m.ResponseType === ResponseType.Error)) {
    return <ErrorOutlineOutlinedIcon />;
  }
  if (messages.some((m) => m.ResponseType === ResponseType.Warning)) {
    return <WarningAmberOutlinedIcon />;
  }
  return <CheckCircleOutlineOutlinedIcon />;
}

function getColor(messages: ResponseMessage[]): 'error' | 'warning' | 'success' {
  if (messages.some((m) => m.ResponseType === ResponseType.Error)) {
    return 'error';
  }
  if (messages.some((m) => m.ResponseType === ResponseType.Warning)) {
    return 'warning';
  }
  return 'success';
}

export function Validation(props: ValidationProps) {
  const { messages, title, showTitle } = props;

  return (
    <>
      {showTitle && (
        <Typography variant="h4" color="primary">
          {title}
        </Typography>
      )}
      <Stack direction="column" spacing={1}>
        {messages.map((message: ResponseMessage) => (
          <Alert
            key={message.ResponseMessage}
            severity={message.ResponseType.toLowerCase() as AlertColor}
          >
            <strong>{message.ResponseType}</strong> - {message.ResponseMessage}
          </Alert>
        ))}
      </Stack>
    </>
  );
}
