import React, { ChangeEvent, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  FormGroup,
  Checkbox,
  FormControlLabel,
  Switch,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { getEnumByValue } from '../../utilities/enumUtils';
import { DropFileUpload } from '../../types/DropFileUpload';
import {
  CustomUploadValidator,
  CustomUploadValidatorReturn,
  SeqType,
  SeqUploadRow,
  SeqUploadRowState,
  SkipForce,
  validateEvenNumberOfFiles,
  validateNoDuplicateFilenames,
} from '../../utilities/uploadUtils';
import UploadSequenceRow from './UploadSequenceRow';
import FileDragDrop from './FileDragDrop';
import HelpSidebar from '../Help/HelpSidebar';
import UploadSequencesHelp from './UploadSequencesHelp';

// TODO: these need mimetypes
// the .fq and .fastq files can't available to select in the browser with octet
const validFormats = {
  '.fq': '',
  '.fastq': '',
  '.fq.gz': 'application/x-gzip',
  '.fastq.gz': 'application/x-gzip',
};

interface SeqPair {
  file: File
  sampleName: string
}

const getSampleNameFromFile = (filename: string) => filename.split('_')[0];

// TODO: fix typescript issues here
const AllHaveSampleNamesWithTwoFilesOnly = {
  func: (files: File[]) => {
    const filenames = files
      .map(f => ({ file: f, sampleName: getSampleNameFromFile(f.name) } as SeqPair));
    // @ts-ignore
    const groupedFilenames = filenames
      .reduce((ubc, u) => ({ ...ubc, [u.sampleName]: [...(ubc[u.sampleName] || []), u] }), {});
    // @ts-ignore
    const problemSampleNames = Object.entries(groupedFilenames)
      // @ts-ignore
      .filter((k) => k[1].length !== 2)
      .map((k) => k[0]);
    if (problemSampleNames.length > 0) {
      return {
        success: false,
        message: `Unable to parse file pairs for the following samples: ${problemSampleNames.join(', ')}`,
      } as CustomUploadValidatorReturn;
    }
    return {
      success: true,
    } as CustomUploadValidatorReturn;
  },
} as CustomUploadValidator;

function UploadSequences() {
  const [files, setFiles] = useState<DropFileUpload[]>([]);
  const [seqUploadRows, setSeqUploadRows] = useState<SeqUploadRow[]>([]);

  // TODO: check this logic with elsewhere
  const updateRow = (newSur: SeqUploadRow) => {
    setSeqUploadRows((st) => st.map((sur) => {
      if (newSur.id === sur.id) {
        return newSur;
      }
      return sur;
    }));
  };

  const queueAllRows = () => {
    const queuedRows = seqUploadRows.map((sur) => {
      sur.state = SeqUploadRowState.Queued;
      return sur;
    });
    setSeqUploadRows(queuedRows);
  };

  const getRowsOfState = (state: SeqUploadRowState) => seqUploadRows.filter(
    sur => sur.state === state,
  );
  
  const uploadInProgress = (): boolean => !seqUploadRows.every(sur =>
    sur.state === SeqUploadRowState.Complete ||
      sur.state === SeqUploadRowState.Errored ||
      sur.state === SeqUploadRowState.Waiting);
  
  const uploadFinished = (): boolean => seqUploadRows.every(sur =>
    sur.state === SeqUploadRowState.Complete ||
      sur.state === SeqUploadRowState.Errored);

  useEffect(() => {
    const calculated = getRowsOfState(SeqUploadRowState.CalculatedHash);
    const calculating = getRowsOfState(SeqUploadRowState.CalculatingHash);
    const queued = getRowsOfState(SeqUploadRowState.Queued);
    const processing = getRowsOfState(SeqUploadRowState.Uploading);

    for (const row of queued.slice(0, Math.abs(calculating.length - 2))) {
      // Calculate 2 hashes at a time
      updateRow({ ...row, state: SeqUploadRowState.CalculatingHash });
    }
    for (const row of calculated.slice(0, Math.abs(processing.length - 1))) {
      // Only upload 1 at a time
      updateRow({ ...row, state: SeqUploadRowState.Uploading });
    }
  }, [[...seqUploadRows.map(sur => sur.state)]]);

  useEffect(() => {
    const newSeqUploadRows = files
      .sort((a, b) => {
        if (a.file.name < b.file.name) {
          return -1;
        }
        return 1;
      })
      .reduce((
        result: SeqUploadRow[],
        value: DropFileUpload,
        index: number,
        array: DropFileUpload[],
      ) => {
        if (index % 2 === 0) {
          result.push({
            id: crypto.randomUUID(),
            seqId: getSampleNameFromFile(value.file.name),
            read1: value,
            read2: array[index + 1],
            state: SeqUploadRowState.Waiting,
          } as SeqUploadRow);
        }
        return result;
      }, []);
    setSeqUploadRows(newSeqUploadRows);
  }, [files]);

  const [selectedSeqType, setSelectedSeqType] = useState<SeqType>(SeqType.FastqIllPe);
  const handleSelectSeqType = (seqTypeStr: string) => {
    const seqType = getEnumByValue(SeqType, seqTypeStr) as SeqType;
    setSelectedSeqType(seqType);
  };
  const [selectedSkipForce, setSelectedSkipForce] = useState<SkipForce>(SkipForce.None);
  const handleSelectSkipForce = (event: ChangeEvent<HTMLInputElement>, skipForceStr: string) => {
    let skipForce = SkipForce.None; // the value we will use if box unchecked
    if (event.target.checked) skipForce = getEnumByValue(SkipForce, skipForceStr) as SkipForce;
    setSelectedSkipForce(skipForce);
  };

  const handleClearFiles = () => {
    setFiles([]);
  };

  const handleUpload = () => {
    queueAllRows();
  };
  
  return (
    <>
      {/* Fix linting indentation later to avoid massive merge conflicts */}
      <Box>
        <Typography variant="h2" paddingBottom={1} color="primary">Upload Sequences</Typography>
        <Grid container spacing={2} sx={{ paddingBottom: 1 }} justifyContent="space-between" alignItems="center">
          <Grid size={{ md: 12, lg: 9 }}>
            <Typography variant="subtitle2" paddingBottom={1}>
              Drag and drop files below to upload sequences.
              <br />
              Only FASTQ uploads are handled via the portal currently. Please
              use the CLI for any FASTA uploads.
            </Typography>
          </Grid>
          <Grid>
            <HelpSidebar
              content={UploadSequencesHelp()}
              title="Upload Instructions"
              chipLabel="View upload instructions"
            />
          </Grid>
        </Grid>
        <Grid container spacing={6} alignItems="stretch" sx={{ paddingBottom: 1 }}>
          <Grid size={{ lg: 6, md: 6, xs: 12 }} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h4" color="primary" paddingBottom={2}>Data ownership</Typography>
            <FormControlLabel
              control={<Switch disabled checked={false} />}
              label="Create new sample records if required"
            />
            <FormControl
              size="small"
              sx={{ minWidth: 200, maxWidth: 400, marginTop: 2, marginBottom: 2 }}
              variant="standard"
            >
              <InputLabel id="select-data-owner-label">Data Owner</InputLabel>
              <Select
                disabled
                labelId="select-data-owner-label"
                id="select-data-owner"
                name="Data Owner"
                value="dummy"
              >
                {/* TODO needs to be a list of organisations in which the user has permission to upload */}
                <MenuItem
                  value="dummy"
                  key="dummy"
                >
                  MyOrg
                </MenuItem>
              </Select>
            </FormControl>
            <FormControl
              size="small"
              sx={{ minWidth: 200, maxWidth: 400, marginTop: 2, marginBottom: 2 }}
              variant="standard"
            >
              <InputLabel id="select-project-share-label">Share with Projects</InputLabel>
              <Select
                disabled
                labelId="select-project-share-label"
                id="select-project-share"
                name="Share with Projects"
                value="none"
              >
                {/* TODO needs to be a multi-select list of projects which the user can share with */}
                <MenuItem
                  value="none"
                  key="none"
                >
                  None
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ lg: 6, md: 6, xs: 12 }} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h4" color="primary">Upload options</Typography>
            <FormControl
              size="small"
              sx={{ minWidth: 200, maxWidth: 400, marginTop: 1, marginBottom: 1 }}
              variant="standard"
            >
              <InputLabel id="fastq-simple-select-label">FASTQ Type</InputLabel>
              <Select
                labelId="fastq-simple-select-label"
                id="fastq-simple-select-label"
                name="fastq"
                value={selectedSeqType}
                onChange={(e) => handleSelectSeqType(e.target.value)}
              >
                {Object.values(SeqType).map((seqType: SeqType) => (
                  <MenuItem
                    value={seqType}
                    key={seqType}
                  >
                    {`${seqType}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography>
              If neither of the below options are selected, the upload will return an error
              for any samples with existing sequences.
            </Typography>
            <FormGroup>
              <Box key="option-skip">
                <FormControlLabel
                  control={(
                    <Checkbox
                      color="secondary"
                      checked={selectedSkipForce === SkipForce.Skip}
                      onChange={(e) => handleSelectSkipForce(e, SkipForce.Skip)}
                      name={SkipForce.Skip}
                    />
                )}
                  label="Skip samples with sequences"
                />
                <Box sx={{ paddingLeft: 4 }}>
                  <Typography variant="subtitle2">
                    Silently skip samples which already have sequences of the same data type,
                    without displaying any errors.
                  </Typography>
                </Box>
              </Box>
              <Box key="option-overwrite">
                <FormControlLabel
                  control={(
                    <Checkbox
                      color="secondary"
                      checked={selectedSkipForce === SkipForce.Force}
                      onChange={(e) => handleSelectSkipForce(e, SkipForce.Force)}
                      name={SkipForce.Force}
                    />
                )}
                  label="Overwrite existing sequences"
                />
                <Box sx={{ paddingLeft: 4 }}>
                  <Typography variant="subtitle2">
                    For any samples with existing sequences of the same data type,
                    disable the old files and upload the new files as replacements.
                  </Typography>
                </Box>
              </Box>
            </FormGroup>
          </Grid>
        </Grid>
        <Grid container alignItems={'center'} justifyContent={'center'} paddingTop={1}>
          {files.length === 0 ?
            <Box sx={{ minWidth: 200, maxWidth: 600 }}>
              <Typography variant="h4" color="primary">Select sequence files</Typography>
              <FileDragDrop
                files={files}
                setFiles={setFiles}
                validFormats={validFormats}
                multiple
                calculateHash={false}
                customValidators={[
                  validateEvenNumberOfFiles,
                  validateNoDuplicateFilenames,
                  AllHaveSampleNamesWithTwoFilesOnly,
                ]}
                hideAfterDrop
              />
            </Box>
            :
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                  {seqUploadRows.length > 0 && (
                    <TableRow sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>
                      <TableCell sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>Seq ID</TableCell>
                      <TableCell sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>Read 1</TableCell>
                      <TableCell sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>Read 2</TableCell>
                      <TableCell sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>State</TableCell>
                      <TableCell sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>Actions</TableCell>
                    </TableRow>
                  )}
                </TableHead>
                <TableBody>
                  {seqUploadRows.map(sur => (
                    <TableRow
                      key={sur.id}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <UploadSequenceRow
                        seqUploadRow={sur}
                        updateRow={updateRow}
                        modeOption={selectedSkipForce}
                        seqTypeOption={selectedSeqType}
                      />
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          }
        </Grid>
        {files.length !== 0 && (
          <Grid container alignItems={'right'} justifyContent={'right'} paddingTop={2}>
            <>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleUpload}
                disabled={uploadInProgress() || uploadFinished()}
              >
                Upload All
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={handleClearFiles}
                disabled={uploadInProgress()}
              >
                Clear Files
              </Button>
            </>
          </Grid>
        )}
      </Box>
    </>
  );
}

export default UploadSequences;
