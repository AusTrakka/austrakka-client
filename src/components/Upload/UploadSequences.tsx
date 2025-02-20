import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useSnackbar, VariantType } from 'notistack';
import { getEnumByValue } from '../../utilities/enumUtils';
import { DropFileUpload } from '../../types/DropFileUpload';
import { ResponseObject } from '../../types/responseObject.interface';
import {
  activeSeqUploadStates,
  createAndShareSamples,
  createPairedSeqUploadRows,
  createSingleSeqUploadRows,
  getSharableProjects,
  getUploadableOrgs,
  OrgDescriptor,
  SeqPairedUploadRow,
  SeqSingleUploadRow,
  SeqType,
  seqTypeNames,
  SeqUploadRow,
  SeqUploadRowState,
  SkipForce,
  validateAllHaveSampleNamesWithTwoFilesOnly,
  validateEvenNumberOfFiles,
  validateNoDuplicateFilenames,
} from '../../utilities/uploadUtils';
import UploadPairedSequenceRow from './UploadPairedSequenceRow';
import UploadSingleSequenceRow from './UploadSingleSequenceRow';
import FileDragDrop from './FileDragDrop';
import HelpSidebar from '../Help/HelpSidebar';
import UploadSequencesHelp from './UploadSequencesHelp';
import { useAppSelector } from '../../app/store';
import { selectUserState, UserSliceState } from '../../app/userSlice';
import LoadingState from '../../constants/loadingState';
import { ResponseType } from '../../constants/responseType';
import { useApi } from '../../app/ApiContext';
import { ResponseMessage } from '../../types/apiResponse.interface';

const validFormats = {
  '.fq': '',
  '.fastq': '',
  '.fq.gz': 'application/x-gzip',
  '.fastq.gz': 'application/x-gzip',
};

interface SelectItem {
  value: string;
  label: string;
}

const uploadRowTypes = {
  [SeqType.FastqIllPe]: UploadPairedSequenceRow,
  [SeqType.FastqIllSe]: UploadSingleSequenceRow,
  [SeqType.FastqOnt]: UploadSingleSequenceRow,
};

const validatorsPerSeqType = {
  [SeqType.FastqIllPe]: [
    validateEvenNumberOfFiles,
    validateNoDuplicateFilenames,
    validateAllHaveSampleNamesWithTwoFilesOnly,
  ],
  [SeqType.FastqIllSe]: [
    validateNoDuplicateFilenames, // TODO check one file per sample
  ],
  [SeqType.FastqOnt]: [
    validateNoDuplicateFilenames, // TODO check one file per sample
  ],
};

function UploadSequences() {
  const [files, setFiles] = useState<DropFileUpload[]>([]);
  const [seqUploadRows, setSeqUploadRows] = useState<SeqUploadRow[]>([]);
  const seqUploadRowStates = useMemo(
    () => seqUploadRows.map(sur => sur.state),
    [seqUploadRows],
  );
  const [selectedSeqType, setSelectedSeqType] = useState<SeqType>(SeqType.FastqIllPe);
  const [selectedSkipForce, setSelectedSkipForce] = useState<SkipForce>(SkipForce.None);
  const [selectedCreateSampleRecords, setSelectedCreateSampleRecords] = useState<boolean>(false);
  const [availableDataOwners, setAvailableDataOwners] = useState<SelectItem[]>([{ value: 'unspecified', label: 'Any' }]);
  const [selectedDataOwner, setSelectedDataOwner] = useState<string>('unspecified');
  const [availableProjects, setAvailableProjects] = useState<SelectItem[]>([]);
  const [selectedProjectShare, setSelectedProjectShare] = useState<string[]>([]);
  const user: UserSliceState = useAppSelector(selectUserState);
  const { enqueueSnackbar } = useSnackbar();
  const { token, tokenLoading } = useApi();

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
  
  const uploadInProgress = (): boolean => !seqUploadRows.every(sur =>
    sur.state === SeqUploadRowState.Complete ||
      sur.state === SeqUploadRowState.Errored ||
      sur.state === SeqUploadRowState.Waiting);
  
  const uploadFinished = (): boolean => seqUploadRows.every(sur =>
    sur.state === SeqUploadRowState.Complete ||
      sur.state === SeqUploadRowState.Errored);

  useEffect(() => {
    const getRowsOfState = (state: SeqUploadRowState) => seqUploadRows.filter(
      sur => sur.state === state,
    );
    
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
  }, [seqUploadRows, seqUploadRowStates]);

  useEffect(() => {
    if (selectedSeqType === SeqType.FastqIllPe) {
      setSeqUploadRows(createPairedSeqUploadRows(files, selectedSeqType));
    } else if (selectedSeqType === SeqType.FastqIllSe || selectedSeqType === SeqType.FastqOnt) {
      setSeqUploadRows(createSingleSeqUploadRows(files, selectedSeqType));
    }
  }, [files, selectedSeqType]);

  const handleSelectSeqType = (seqTypeStr: string) => {
    const seqType = getEnumByValue(SeqType, seqTypeStr) as SeqType;
    setSelectedSeqType(seqType);
  };

  const handleSelectSkipForce = (event: ChangeEvent<HTMLInputElement>, skipForceStr: string) => {
    let skipForce = SkipForce.None; // the value we will use if box unchecked
    if (event.target.checked) skipForce = getEnumByValue(SkipForce, skipForceStr) as SkipForce;
    setSelectedSkipForce(skipForce);
  };

  const handleClearFiles = () => {
    setFiles([]);
  };

  const variantTypeForResponse = (responseType: ResponseType): VariantType => {
    const responseMessageVariants = {
      [ResponseType.Success]: 'success',
      [ResponseType.Warning]: 'warning',
      [ResponseType.Error]: 'error',
    };
    return (responseMessageVariants[responseType] ?? 'info') as VariantType;
  };
  
  const showSampleCreationMessages = (response: ResponseObject) => {
    const baseMessages = {
      [ResponseType.Success]: 'Samples created successfully',
      [ResponseType.Warning]: 'Samples created with warnings',
      [ResponseType.Error]: 'Error creating samples',
    };
    const baseMessage = baseMessages[response.status] ?? 'Unknown error creating samples';

    const responseMessageTimeouts = {
      [ResponseType.Success]: 3000,
      [ResponseType.Warning]: 8000,
      [ResponseType.Error]: 8000,
    };
    
    if (!response?.messages || response?.messages?.length === 0) {
      enqueueSnackbar(baseMessage, {
        variant: variantTypeForResponse(response.status),
        autoHideDuration: responseMessageTimeouts[response.status] ?? 5000,
      });
    } else if (response?.messages?.length === 1) {
      enqueueSnackbar(`${baseMessage}: ${response.message}`, {
        variant: variantTypeForResponse(response.status),
        autoHideDuration: responseMessageTimeouts[response.status] ?? 5000,
      });
    } else {
      enqueueSnackbar(baseMessage, {
        variant: variantTypeForResponse(response.status),
        autoHideDuration: responseMessageTimeouts[response.status] ?? 5000,
      });
      response.messages.forEach((message: ResponseMessage) => {
        enqueueSnackbar(message.ResponseMessage, {
          variant: variantTypeForResponse(message.ResponseType),
          autoHideDuration: responseMessageTimeouts[message.ResponseType] ?? 5000,
        });
      });
    }
  };
  
  const handleUpload = async () => {
    // TODO need to use state for this really, to await tokenLoading if necessary
    // TODO this hacky code means we silently do nothing if we are not ready, 
    // and the user has to re-click
    if (tokenLoading !== LoadingState.SUCCESS) return;
   
    if (selectedCreateSampleRecords) {
      const response: ResponseObject =
        await createAndShareSamples(selectedDataOwner, selectedProjectShare, seqUploadRows, token);
      showSampleCreationMessages(response);
      if (response.status === ResponseType.Error) return;
    }
    queueAllRows();
  };
  
  // Data owner
  useEffect(() => {
    if (!selectedCreateSampleRecords) {
      setAvailableDataOwners([{ value: 'unspecified', label: 'Any' }]);
      setSelectedDataOwner('unspecified');
      return;
    }
    if (user.loading !== LoadingState.SUCCESS) {
      setAvailableDataOwners([]);
      return;
    }
    const orgs: OrgDescriptor[] = getUploadableOrgs(user.groupRoles ?? []);
    // This mapping exists here so we can set "Any" as a value when disabled, regardless of 
    // label format
    // Displaying org abbreviations in the dropdown for now, but this can be easily changed
    setAvailableDataOwners(
      orgs.map((org: OrgDescriptor) => ({ value: org.abbreviation, label: org.abbreviation })),
    );
    if (orgs.some(org => org.abbreviation === user.orgAbbrev)) {
      setSelectedDataOwner(user.orgAbbrev);
    }
  }, [selectedCreateSampleRecords, user.groupRoles, user.loading, user.orgAbbrev]);
  
  // Projects
  useEffect(() => {
    if (!selectedCreateSampleRecords) {
      setAvailableProjects([]);
      setSelectedProjectShare([]);
      return;
    }
    if (user.loading !== LoadingState.SUCCESS) {
      setAvailableProjects([]);
      return;
    }
    const projects: string[] = getSharableProjects(user.groupRoles ?? []);
    setAvailableProjects(
      projects.map((projectAbbrev: string) => ({ value: projectAbbrev, label: projectAbbrev })),
    );
  }, [selectedCreateSampleRecords, user.groupRoles, user.loading, user.orgAbbrev]);
  
  const renderUploadRow = (row: SeqUploadRow) => {
    // TODO maybe do away with this if statement, use dynamic types
    if (uploadRowTypes[row.seqType] === UploadPairedSequenceRow) {
      return (
        <UploadPairedSequenceRow
          seqUploadRow={row as SeqPairedUploadRow}
          updateRow={updateRow}
          modeOption={selectedSkipForce}
        />
      );
    }
    // uploadRowTypes[row.seqType] === UploadSingleSequenceRow)
    return (
      <UploadSingleSequenceRow
        seqUploadRow={row as SeqSingleUploadRow}
        updateRow={updateRow}
        modeOption={selectedSkipForce}
      />
    );
  };
  
  return (
    <>
      <Box>
        <Typography variant="h2" paddingBottom={1} color="primary">Upload Sequences</Typography>
        <Grid container spacing={2} sx={{ paddingBottom: 1 }} justifyContent="space-between" alignItems="center">
          <Grid size={{ md: 12, lg: 9 }}>
            <Typography variant="subtitle2" paddingBottom={1}>
              Drag and drop files below, or click, to upload sequences.
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
              id="create-sample-records-toggle"
              control={(
                <Switch
                  checked={selectedCreateSampleRecords}
                  onChange={(e) => setSelectedCreateSampleRecords(e.target.checked)}
                />
              )}
              label="Create new sample records if required"
            />
            <FormControl
              size="small"
              sx={{ minWidth: 200, maxWidth: 400, marginTop: 2, marginBottom: 2 }}
              variant="standard"
            >
              <InputLabel id="select-data-owner-label">Data Owner</InputLabel>
              <Select
                disabled={!selectedCreateSampleRecords}
                labelId="select-data-owner-label"
                id="select-data-owner"
                name="Data Owner"
                value={selectedDataOwner}
                onChange={(e) => setSelectedDataOwner(e.target.value)}
              >
                {
                  availableDataOwners.map((dataOwner: SelectItem) => (
                    <MenuItem
                      value={dataOwner.value}
                      key={dataOwner.value}
                    >
                      {dataOwner.label}
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>
            <FormControl
              size="small"
              sx={{ minWidth: 200, maxWidth: 400, marginTop: 2, marginBottom: 2 }}
              variant="standard"
            >
              <InputLabel id="select-project-share-label">Share with Projects</InputLabel>
              <Select
                disabled={!selectedCreateSampleRecords}
                labelId="select-project-share-label"
                id="select-project-share"
                name="Share with Projects"
                value={selectedProjectShare}
                multiple
                onChange={(e) => setSelectedProjectShare([e.target.value].flat())}
              >
                {
                  availableProjects.map((project: SelectItem) => (
                    <MenuItem
                      value={project.value}
                      key={project.value}
                    >
                      {project.label}
                    </MenuItem>
                  ))
                }
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
                    {`${seqTypeNames[seqType]}`}
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
        <Grid container alignItems="center" justifyContent="center" paddingTop={1}>
          {files.length === 0 ? (
            <Box sx={{ minWidth: 200, maxWidth: 600 }}>
              <Typography variant="h4" color="primary">Select sequence files</Typography>
              <FileDragDrop
                files={files}
                setFiles={setFiles}
                validFormats={validFormats}
                multiple
                calculateHash={false}
                customValidators={validatorsPerSeqType[selectedSeqType]}
              />
            </Box>
          ) : (
            <Stack>
              {seqUploadRowStates.some(state => activeSeqUploadStates.includes(state)) && (
                <Alert severity="warning">
                  <Typography variant="body2">
                    Uploading; do not navigate away from this page until
                    all files have been uploaded.
                  </Typography>
                </Alert>
              )}
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} size="small" aria-label="simple table">
                  <TableHead>
                    {seqUploadRows.length > 0 &&
                      uploadRowTypes[selectedSeqType] === UploadPairedSequenceRow && (
                      <TableRow sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>
                        <TableCell sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>Seq ID</TableCell>
                        <TableCell sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>Read 1</TableCell>
                        <TableCell sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>Read 2</TableCell>
                        <TableCell sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>State</TableCell>
                        <TableCell sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>Actions</TableCell>
                      </TableRow>
                    )}
                    {seqUploadRows.length > 0 &&
                      uploadRowTypes[selectedSeqType] === UploadSingleSequenceRow && (
                      <TableRow sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>
                        <TableCell sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>Seq ID</TableCell>
                        <TableCell sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>File</TableCell>
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
                        {renderUploadRow(sur)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}
        </Grid>
        {files.length !== 0 && (
          <Grid container alignItems="right" justifyContent="right" paddingTop={2} paddingBottom={6}>
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
