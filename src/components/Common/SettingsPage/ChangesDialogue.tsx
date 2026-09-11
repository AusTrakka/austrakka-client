import {
  CheckCircleOutline,
  Close as CloseIcon,
  ErrorOutline,
  InfoOutlined,
  Save,
  WarningAmber,
} from '@mui/icons-material';
import {
  type AlertColor,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import { Theme } from '../../../assets/themes/theme';

interface ChangesDialogueProps {
  title: string;
  children?: ReactNode;
  isOpen: boolean;
  severity?: AlertColor;
  size?: 'sm' | 'md' | 'lg';
  confirmText?: string;
  cancelText?: string;
  closeText?: string;
  confirmLoading?: boolean;
  disableConfirm?: boolean;
  onClose: () => void;
  onCancel?: () => void;
  onConfirm: () => void;
}

const severityIcon: Record<AlertColor, ReactNode> = {
  success: <CheckCircleOutline color="success" />,
  error: <ErrorOutline color="error" />,
  warning: <WarningAmber color="warning" />,
  info: <InfoOutlined color="info" />,
};

export default function ChangesDialogue(props: ChangesDialogueProps) {
  return (
    <Dialog
      open={props.isOpen}
      onClose={props.onClose}
      maxWidth={props.size}
      fullWidth
      aria-labelledby="changes-dialogue-title"
      slotProps={{
        paper: {
          sx: {
            minWidth: { sm: '20vw', md: '30vw' },
            minHeight: { sm: '15vh', md: '25vh' },
          },
        },
      }}
    >
      <DialogTitle id="changes-dialogue-title">
        <Stack direction="row" spacing={1} alignItems="center">
          {props.severity && severityIcon[props.severity]}
          <Typography variant="h6" component="span">
            {props.title}
          </Typography>
        </Stack>
        <IconButton
          aria-label="close"
          onClick={props.onClose}
          disabled={props.confirmLoading}
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>{props.children}</DialogContent>
      <DialogActions>
        {props.onCancel && (
          <Button
            onClick={props.onCancel}
            disabled={props.confirmLoading}
            variant={'contained'}
            sx={{
              backgroundColor: Theme.PrimaryGrey500,
            }}
          >
            {props.cancelText ?? 'Cancel'}
          </Button>
        )}
        <Button
          onClick={props.onConfirm}
          variant="contained"
          disabled={props.disableConfirm || props.confirmLoading}
          startIcon={
            props.confirmLoading ? <CircularProgress size={16} color="inherit" /> : <Save />
          }
          sx={{
            color: 'white', // todo: do we not have a constant for this?
            backgroundColor: Theme.SecondaryLightGreen,
          }}
        >
          {props.confirmText ?? 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
