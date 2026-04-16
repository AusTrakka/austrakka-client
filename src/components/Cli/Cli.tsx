import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { Theme } from '../../assets/themes/theme';

interface CliProps {
  cli: boolean;
  handleHelpClose: (event: object, reason: 'backdropClick' | 'escapeKeyDown') => void;
}

function Cli(props: CliProps) {
  const { cli, handleHelpClose: handleCliClose } = props;

  const close = () => {
    handleCliClose({ undefined }, 'backdropClick');
  };

  return (
    <Dialog open={cli} onClose={handleCliClose}>
      <Box>
        <DialogTitle>Connect CLI</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paddingBottom={2}>
            To connect a trakka CLI, set the following environment variable:
            <br></br>
          </Typography>
          <Typography
            variant="body2"
            sx={{
              border: '1px solid',
              borderRadius: '6px',
              padding: '2px 4px',
              backgroundColor: Theme.PrimaryGrey50,
              borderColor: Theme.PrimaryGrey300,
              display: 'inline',
            }}
          >
            <code>AT_URI={import.meta.env.VITE_REACT_API_URL}</code>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Close</Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default Cli;
