import ErrorIcon from '@mui/icons-material/Error';
import {
  Box,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { type CsvError, CsvErrorType } from '../../utilities/uploadUtils';
import CustomDrawer from '../Common/CustomDrawer';
import { UploadErrorMessages } from './Constants/UploadMessages';

export interface CsvErrorsTableProps {
  onChange: (fileNames: string[]) => void;
  errors: CsvError[];
}

const csvErrorMessages: Record<CsvErrorType, string> = {
  [CsvErrorType.ADDITIONAL]: UploadErrorMessages.ADDITIONAL_FILE_FOUND,
  [CsvErrorType.MISSING]: UploadErrorMessages.FILE_NOT_FOUND,
};

export default function CsvErrorsTable({ onChange, errors }: CsvErrorsTableProps) {
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const getTableRows = () =>
    errors.map((err) => (
      <TableRow key={err.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        <TableCell sx={{ padding: '6px' }}>
          <Typography variant="body2" fontSize=".9rem">
            {err.sampleName ?? <Chip label={'No Seq ID'} />}
          </Typography>
        </TableCell>
        <TableCell sx={{ padding: '6px' }}>
          {(() => {
            const uniqueItems = [...new Set(err.items)];
            const visibleItems = uniqueItems.slice(0, 2);
            const remainingCount = uniqueItems.length - visibleItems.length;

            return (
              <>
                {visibleItems.map((i) => (
                  <Chip key={err.id + i} label={i} />
                ))}
                {remainingCount > 0 && (
                  <Chip
                    key={`${err.id}-more`}
                    label={`+${remainingCount} more`}
                    variant="outlined"
                    onClick={() => setDrawerOpen(true)}
                  />
                )}
              </>
            );
          })()}
        </TableCell>
        <TableCell sx={{ padding: '6px' }}>
          <Typography variant="body2" fontSize=".9rem">
            {`${csvErrorMessages[err.errorType]}`}
          </Typography>
        </TableCell>
        <TableCell sx={{ padding: '6px' }}>
          <Button
            variant={'outlined'}
            color={'error'}
            size={'small'}
            onClick={() => onChange(err.items)}
          >
            <Typography variant="button" fontSize=".8rem">
              Remove
            </Typography>
          </Button>
        </TableCell>
      </TableRow>
    ));
  return (
    <Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell key={'SeqIDHeader'} sx={{ padding: '6px' }}>
                Seq ID
              </TableCell>
              <TableCell key={'FilesHeader'} sx={{ padding: '6px' }}>
                Files
              </TableCell>
              <TableCell key={'ReasonHeader'} sx={{ padding: '6px' }}>
                Reason
              </TableCell>
              <TableCell key={'ActionsHeader'} sx={{ padding: '6px' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>{getTableRows()}</TableBody>
        </Table>
      </TableContainer>
      <CustomDrawer drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen}>
        <Box>
          <Box display={'flex'} flexDirection={'row'} gap={2} alignItems={'center'}>
            <ErrorIcon fontSize="large" color="error" />
            <Typography variant="h4" color="primary">
              {'CSV File Errors'}
            </Typography>
          </Box>
          <Typography sx={{ paddingTop: '20px' }} variant="subtitle2">
            {'The following files did not match any Seq ID in the supplied CSV file'}
          </Typography>
          <TableContainer>
            <Table
              sx={{
                width: '100%',
                borderCollapse: 'collapse',
                mt: '22px',
                '& td, & th': { borderBottom: 'none' },
              }}
            >
              <Box>
                {errors
                  .filter((x) => !x.sampleName)
                  .map((f) => {
                    return f.items.map((i) => {
                      return <Chip key={f.id + i} label={i} sx={{ margin: '5px' }} />;
                    });
                  })}
              </Box>
            </Table>
          </TableContainer>
        </Box>
      </CustomDrawer>
    </Box>
  );
}
