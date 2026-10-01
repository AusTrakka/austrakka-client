import { ErrorOutline } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
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
import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApi } from '../../app/ApiContext';
import { useCompactMode } from '../../app/CompactModeContext';
import { useAppSelector } from '../../app/store';
import { selectUserState, type UserSliceState } from '../../app/userSlice';
import LoadingState from '../../constants/loadingState';
import { ResponseType } from '../../constants/responseType';
import type { DropFileUpload } from '../../types/DropFileUpload';
import type { Project } from '../../types/dtos';
import type { ResponseObject } from '../../types/responseObject.interface';
import {
  type OrgDescriptor,
  type SeqPairedUploadRow,
  type SeqSingleUploadRow,
  SeqType,
  type SeqUploadCsvPair,
  type SeqUploadCsvSingle,
  type SeqUploadRow,
  SeqUploadRowState,
  SkipForce,
  seqTypeNames,
  validFormats,
  validSuffixes,
} from '../../types/sequploadtypes';
import { getEnumByValue } from '../../utilities/enumUtils';
import { getProjectList } from '../../utilities/resourceUtils';
import {
  activeSeqUploadStates,
  type CsvError,
  CsvErrorType,
  createPairedSeqUploadRows,
  createPairedSeqUploadRowsFromCsv,
  createSingleSeqUploadRows,
  getSampleSharableProjects,
  getUploadableSeqOrgs,
  createSingleSeqUploadRowsFromCsv,
  getSharableProjects,
  getUploadableOrgs,
  parseSeqUploadCsvPairs,
  parseSeqUploadCsvSingles,
  splitFastaByContig,
  validateAllHaveSampleNamesWithOneFileOnly,
  validateAllHaveSampleNamesWithTwoFilesOnly,
  validateEvenNumberOfFiles,
  validateNoDuplicateFilenames,
} from '../../utilities/uploadUtils';
import HelpSidebar from '../Help/HelpSidebar';
import ChangesDialog from '../Users/MainViews/ChangesDialog';
import { ErrorMessages } from './Constants/UploadMessages';
import FileDragDrop from './FileDragDrop';
import UploadPairedSequenceRow from './UploadPairedSequenceRow';
import UploadSequencesHelp from './UploadSequencesHelp';
import UploadSingleFastaContigRow from './UploadSingleFastaContigRow';
import UploadSingleSequenceRow from './UploadSingleSequenceRow';

const csvFileValidFormats = {
  csv: 'text/csv',
};

// biome-ignore lint/complexity/noBannedTypes: historic
const uploadRowTypes: Record<SeqType, Function> = {
  [SeqType.FastqIllPe]: UploadPairedSequenceRow,
  [SeqType.FastqIllSe]: UploadSingleSequenceRow,
  [SeqType.FastqOnt]: UploadSingleSequenceRow,
  [SeqType.FastaAsm]: UploadSingleSequenceRow,
  [SeqType.FastaCns]: UploadSingleFastaContigRow,
};

const validatorsPerSeqType = {
  [SeqType.FastqIllPe]: [
    validateEvenNumberOfFiles,
    validateNoDuplicateFilenames,
    validateAllHaveSampleNamesWithTwoFilesOnly,
  ],
  [SeqType.FastqIllSe]: [validateNoDuplicateFilenames, validateAllHaveSampleNamesWithOneFileOnly],
  [SeqType.FastqOnt]: [validateNoDuplicateFilenames, validateAllHaveSampleNamesWithOneFileOnly],
  [SeqType.FastaAsm]: [validateNoDuplicateFilenames, validateAllHaveSampleNamesWithOneFileOnly],
  // FastaCns is a special case: validation is applied during file-splitting transform
  [SeqType.FastaCns]: [],
};

const csvErrorMessages: Record<CsvErrorType, string> = {
  [CsvErrorType.ADDITIONAL]: ErrorMessages.ADDITIONAL_FILE_FOUND,
  [CsvErrorType.MISSING]: ErrorMessages.FILE_NOT_FOUND,
};

const fileTransformPerSeqType = (seqType: SeqType) =>
  seqType === SeqType.FastaCns ? splitFastaByContig : undefined;

function UploadSequences() {
  const [files, setFiles] = useState<DropFileUpload[]>([]);
  const [seqUploadRows, setSeqUploadRows] = useState<SeqUploadRow[]>([]);
  const seqUploadRowStates = useMemo(() => seqUploadRows.map((sur) => sur.state), [seqUploadRows]);
  const [selectedSeqType, setSelectedSeqType] = useState<SeqType>(SeqType.FastqIllPe);
  const [selectedSkipForce, setSelectedSkipForce] = useState<SkipForce>(SkipForce.None);
  const [selectedCreateSampleRecords, setSelectedCreateSampleRecords] = useState<boolean>(false);
  const [availableDataOwners, setAvailableDataOwners] = useState<string[]>([]); // Org abbreviations
  const [selectedDataOwner, setSelectedDataOwner] = useState<string | null>(null);
  const [projectAbbrevs, setProjectAbbrevs] = useState<string[]>([]);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [selectedProjectShare, setSelectedProjectShare] = useState<string[]>([]);

  const [csvErrors, setCsvErrors] = useState<CsvError[]>([]);
  const maxVisibleCsvErrors = 4;
  const [pageErrorMsg, setPageErrorMsg] = useState<string | null>(null);
  // const addError = useCallback((message: string) => {
  //   setPageErrorMessages((prevErrors) => [...prevErrors, message]);
  // }, []);

  const [showErrorsDialog, setShowErrorsDialog] = useState<boolean>(false);

  const flatCsvErrors = useMemo(() => {
    return csvErrors.flatMap((error) => {
      let prefix: string = '';
      if (error.sampleName !== undefined && error.sampleName !== '') {
        prefix = `(${error.sampleName})`;
      }
      return error.items.map((item) => ({
        label: `${prefix} ${csvErrorMessages[error.errorType]}: "${item}"`,
        item,
      }));
    });
  }, [csvErrors]);

  const fileDragDropRef = useRef<any>(null);
  const user: UserSliceState = useAppSelector(selectUserState);

  // todo: new csv logic (separating to make wip dev easier, re-order later)
  const [fileListingCsv, setFileListingCsv] = useState<DropFileUpload[]>([]);
  const [csvUploadPairs, setcsvUploadPairs] = useState<SeqUploadCsvPair[]>([]);
  const [csvUploadSingles, setcsvUploadSingles] = useState<SeqUploadCsvSingle[]>([]);

  const { compact } = useCompactMode();
  const { token, tokenLoading } = useApi();

  const updateRow = (newSur: SeqUploadRow) => {
    setSeqUploadRows((st) =>
      st.map((sur) => {
        if (newSur.id === sur.id) {
          return newSur;
        }
        return sur;
      }),
    );
  };

  const queueAllRows = (clientSessionId: string) => {
    const rowUpdateFunction = (sur: SeqUploadRow) => {
      sur.state = SeqUploadRowState.Queued;
      sur.clientSessionId = clientSessionId;
      return sur;
    };
    setSeqUploadRows((rows) => rows.map(rowUpdateFunction));
  };

  const uploadInProgress = (): boolean =>
    !seqUploadRows.every(
      (sur) =>
        sur.state === SeqUploadRowState.Complete ||
        sur.state === SeqUploadRowState.Errored ||
        sur.state === SeqUploadRowState.Waiting ||
        sur.state === SeqUploadRowState.Incomplete,
    );

  const uploadFinished = (): boolean =>
    seqUploadRows.every(
      (sur) =>
        sur.state === SeqUploadRowState.Complete ||
        sur.state === SeqUploadRowState.Errored ||
        sur.state === SeqUploadRowState.Incomplete,
    );

  useEffect(() => {
    async function processPairingFile() {
      if (fileListingCsv.length === 0) {
        setcsvUploadPairs([]);
        setcsvUploadSingles([]);
        return;
      }
      try {
        if (selectedSeqType === SeqType.FastqIllPe) {
          const pairingRecords = await parseSeqUploadCsvPairs(fileListingCsv[0].file);
          setcsvUploadPairs(pairingRecords);
        } else if (selectedSeqType !== SeqType.FastaCns) {
          const pairingRecords = await parseSeqUploadCsvSingles(fileListingCsv[0].file);
          setcsvUploadSingles(pairingRecords);
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          setPageErrorMsg(e.message);
        } else {
          setPageErrorMsg(ErrorMessages.UNEXPECTED_ERROR);
        }
        setFileListingCsv([]);
      }
    }

    void processPairingFile();
  }, [fileListingCsv, selectedSeqType]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: historic
  useEffect(() => {
    const getRowsOfState = (state: SeqUploadRowState) =>
      seqUploadRows.filter((sur) => sur.state === state);

    const calculated = getRowsOfState(SeqUploadRowState.CalculatedHash);
    const calculating = getRowsOfState(SeqUploadRowState.CalculatingHash);
    const queued = getRowsOfState(SeqUploadRowState.Queued);
    const processing = getRowsOfState(SeqUploadRowState.Uploading);

    for (const row of queued.slice(0, Math.abs(calculating.length - 2))) {
      // Preprocess 2 samples at a time
      if (selectedCreateSampleRecords) {
        updateRow({ ...row, state: SeqUploadRowState.CreateSample });
      } else {
        updateRow({ ...row, state: SeqUploadRowState.CalculatingHash });
      }
    }
    for (const row of calculated.slice(0, Math.abs(processing.length - 1))) {
      // Only upload 1 at a time
      updateRow({ ...row, state: SeqUploadRowState.Uploading });
    }
  }, [seqUploadRows, seqUploadRowStates, selectedCreateSampleRecords]);

  useEffect(() => {
    const rowType = uploadRowTypes[selectedSeqType];
    let rows: SeqUploadRow[] = [];

    if (rowType === UploadPairedSequenceRow) {
      if (csvUploadPairs.length > 0) {
        const { rows: csvRows, missing } = createPairedSeqUploadRowsFromCsv(files, csvUploadPairs);
        rows = csvRows;

        if (missing.length > 0) {
          setCsvErrors(missing);
        } else {
          setCsvErrors([]);
        }
      } else {
        rows = createPairedSeqUploadRows(files, validSuffixes(selectedSeqType));
      }
    } else if (rowType === UploadSingleSequenceRow) {
      if (csvUploadSingles.length > 0) {
        const { rows: csvRows, missing } = createSingleSeqUploadRowsFromCsv(
          files,
          csvUploadSingles,
          selectedSeqType,
        );
        rows = csvRows;

        if (missing.length > 0) {
          setCsvErrors(missing);
        } else {
          setCsvErrors([]);
        }
      } else {
        rows = createSingleSeqUploadRows(files, selectedSeqType, validSuffixes(selectedSeqType));
      }
    } else {
      // this will be fasta contig
      rows = createSingleSeqUploadRows(files, selectedSeqType, validSuffixes(selectedSeqType));
    }
    setSeqUploadRows(rows);
  }, [files, selectedSeqType, csvUploadPairs, csvUploadSingles]);

  const handleSelectSeqType = (seqTypeStr: string) => {
    const seqType = getEnumByValue(SeqType, seqTypeStr) as SeqType;
    setPageErrorMsg(null);
    setSelectedSeqType(seqType);
  };

  const handleSelectSkipForce = (event: ChangeEvent<HTMLInputElement>, skipForceStr: string) => {
    let skipForce = SkipForce.None; // the value we will use if box unchecked
    if (event.target.checked) skipForce = getEnumByValue(SkipForce, skipForceStr) as SkipForce;
    setSelectedSkipForce(skipForce);
  };

  const handleClearCsvFile = useCallback(() => {
    setCsvErrors([]);
  }, []);

  const handleClearSampleFiles = () => {
    fileDragDropRef.current?.clearFiles();
  };

  const showCsvFileUpload = () => {
    return selectedSeqType !== SeqType.FastaCns;
  };

  const handleUpload = async () => {
    // TODO need to use state for this really, to await tokenLoading if necessary
    // TODO this hacky code means we silently do nothing if we are not ready,
    //  and the user has to re-click
    if (tokenLoading !== LoadingState.SUCCESS) return;

    if (!selectedDataOwner) return;

    // UI elements are also disabled to guard against this
    if (uploadInProgress() || csvErrors.length > 0) return;

    const clientSessionId: string = crypto.randomUUID();

    queueAllRows(clientSessionId);
  };

  // Data owner
  useEffect(() => {
    if (user.loading !== LoadingState.SUCCESS) {
      setAvailableDataOwners([]);
      return;
    }
    const orgs: OrgDescriptor[] = getUploadableSeqOrgs(user);
    setAvailableDataOwners(orgs.map((org: OrgDescriptor) => org.abbreviation));
    if (orgs.some((org) => org.abbreviation === user.orgAbbrev)) {
      setSelectedDataOwner(user.orgAbbrev);
    } else if (orgs.length > 0) {
      setSelectedDataOwner(orgs[0].abbreviation);
    }
    if (orgs.length === 0) {
      // todo future cleanup: move to a constants file, as it's re-used
      setPageErrorMsg(ErrorMessages.PERMISSIONS_REQUIRED);
    }
  }, [user, user.loading, user.orgAbbrev]);

  // Projects

  // todo: it would be worthwhile if we added comments to explain why we add these ignores
  //  as it's entirely unclear to me why we have an extra dependency
  // biome-ignore lint/correctness/useExhaustiveDependencies: historic
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
    const abbrevs: string[] = getSampleSharableProjects(user);
    setProjectAbbrevs(abbrevs);
  }, [selectedCreateSampleRecords, user, user.loading, user.orgAbbrev]);

  // todo future cleanup: create a hook for this, identical code in the upload metadata component
  useEffect(() => {
    async function getProjects() {
      const projectResponse: ResponseObject<Project[]> = await getProjectList(token);
      if (projectResponse.status === ResponseType.Success) {
        const filteredProjects = projectResponse.data?.filter(
          ({ clientType }) => !clientType || clientType === import.meta.env.VITE_BRANDING_ID,
        );

        const abbrevs = new Set(projectAbbrevs);
        const projects = filteredProjects?.filter((project) => abbrevs.has(project.abbreviation));
        setAvailableProjects(projects ?? []);
      }
    }
    if (
      tokenLoading !== LoadingState.IDLE &&
      tokenLoading !== LoadingState.LOADING &&
      projectAbbrevs.length > 0
    ) {
      void getProjects();
    }
  }, [token, tokenLoading, projectAbbrevs]);

  const renderUploadHeader = () => {
    if (uploadRowTypes[selectedSeqType] === UploadPairedSequenceRow) {
      return (
        <TableRow sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>
          <TableCell sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>
            Seq ID
          </TableCell>
          <TableCell sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>
            Read 1
          </TableCell>
          <TableCell sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>
            Read 2
          </TableCell>
          <TableCell sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>
            State
          </TableCell>
          <TableCell sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>
            Actions
          </TableCell>
        </TableRow>
      );
    }
    if (uploadRowTypes[selectedSeqType] === UploadSingleSequenceRow) {
      return (
        <TableRow sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>
          <TableCell sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>
            Seq ID
          </TableCell>
          <TableCell sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>
            File
          </TableCell>
          <TableCell sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>
            State
          </TableCell>
          <TableCell sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>
            Actions
          </TableCell>
        </TableRow>
      );
    }
    if (uploadRowTypes[selectedSeqType] === UploadSingleFastaContigRow) {
      return (
        <TableRow sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>
          <TableCell sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>
            Seq ID
          </TableCell>
          <TableCell sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>
            State
          </TableCell>
          <TableCell sx={{ padding: '8px', paddingLeft: '4px', paddingRight: '4px' }}>
            Actions
          </TableCell>
        </TableRow>
      );
    }
    throw new Error('Unable to render table, unknown upload row type');
  };

  const renderUploadRow = (row: SeqUploadRow) => {
    if (uploadRowTypes[row.seqType] === UploadPairedSequenceRow) {
      return (
        <UploadPairedSequenceRow
          seqUploadRow={row as SeqPairedUploadRow}
          updateRow={updateRow}
          modeOption={selectedSkipForce}
          owner={selectedDataOwner}
          sharedProjects={selectedProjectShare}
        />
      );
    }
    if (uploadRowTypes[row.seqType] === UploadSingleSequenceRow) {
      return (
        <UploadSingleSequenceRow
          seqUploadRow={row as SeqSingleUploadRow}
          updateRow={updateRow}
          modeOption={selectedSkipForce}
          owner={selectedDataOwner}
          sharedProjects={selectedProjectShare}
        />
      );
    }
    if (uploadRowTypes[row.seqType] === UploadSingleFastaContigRow) {
      return (
        <UploadSingleFastaContigRow
          seqUploadRow={row as SeqSingleUploadRow}
          updateRow={updateRow}
          modeOption={selectedSkipForce}
          owner={selectedDataOwner}
          sharedProjects={selectedProjectShare}
        />
      );
    }

    throw new Error('Unable to render table, unknown upload row type');
  };

  return (
    <>
      <Box>
        <Typography variant="h3" paddingBottom={1} color="primary">
          Upload Sequences
        </Typography>
        <Grid
          container
          spacing={2}
          sx={{ paddingBottom: 1 }}
          justifyContent="space-between"
          alignItems="center"
        >
          <ChangesDialog
            title={'Errors'}
            severity={'error'}
            isOpen={showErrorsDialog}
            confirmText={'OK'}
            confirmIcon={<></>}
            onClose={() => setShowErrorsDialog(false)}
            onConfirm={() => setShowErrorsDialog(false)}
          >
            <List dense>
              {flatCsvErrors.map((err) => (
                <ListItem key={err.item}>
                  <ListItemIcon>
                    <ErrorOutline color="error" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText secondary={err.label} />
                </ListItem>
              ))}
            </List>
          </ChangesDialog>
          {pageErrorMsg && (
            <Grid size={12}>
              <Alert severity="error">{pageErrorMsg}</Alert>
            </Grid>
          )}
          {flatCsvErrors.length > 0 ? (
            <Grid size={12}>
              <Alert severity="error">
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant={'h5'}>CSV Errors</Typography>
                  {flatCsvErrors.slice(0, maxVisibleCsvErrors).map(({ label, item }) => (
                    <Typography key={item} fontSize="1rem">
                      {label}
                    </Typography>
                  ))}
                  {flatCsvErrors.length > maxVisibleCsvErrors && (
                    <Button
                      sx={{ mt: 1, alignSelf: 'flex-end' }}
                      onClick={() => setShowErrorsDialog(true)}
                    >
                      <Typography variant="body2" fontSize="1rem" sx={{ textTransform: 'none' }}>
                        ...and {flatCsvErrors.length - maxVisibleCsvErrors} more
                      </Typography>
                    </Button>
                  )}
                </Box>
              </Alert>
            </Grid>
          ) : null}
          <Grid size={{ md: 12, lg: 9 }}>
            <Typography variant="subtitle2" paddingBottom={1}>
              Drag and drop files below, or click, to upload sequences.
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
          {/* Left column: data ownership and sharing */}
          <Grid size={{ lg: 6, md: 6, xs: 12 }} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h4" color="primary" paddingBottom={2}>
              Data ownership and validation
            </Typography>
            <FormControl
              size="small"
              sx={{ minWidth: 200, maxWidth: 400, marginBottom: 2 }}
              variant="standard"
            >
              <InputLabel id="select-data-owner-label">Data Owner</InputLabel>
              <Select
                labelId="select-data-owner-label"
                id="select-data-owner"
                name="Data Owner"
                value={selectedDataOwner || ''}
                onChange={(e) => setSelectedDataOwner(e.target.value)}
                disabled={uploadInProgress()}
              >
                {availableDataOwners.map((org: string) => (
                  <MenuItem value={org} key={org}>
                    {org}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              id="create-sample-records-toggle"
              control={
                <Switch
                  size={compact ? 'small' : 'medium'}
                  checked={selectedCreateSampleRecords}
                  onChange={(e) => setSelectedCreateSampleRecords(e.target.checked)}
                  disabled={uploadInProgress()}
                />
              }
              label="Create new sample records if required"
            />
            <FormControl
              size="small"
              sx={{ minWidth: 200, maxWidth: 400, marginBottom: 2 }}
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
                {/* If detailed project list isn't populated, use abbreviation list only */}
                {availableProjects && availableProjects.length > 0
                  ? availableProjects.map((project: Project) => (
                      <MenuItem value={project.abbreviation} key={project.abbreviation}>
                        {`${project.abbreviation} : ${project.name}`}
                      </MenuItem>
                    ))
                  : projectAbbrevs.map((project: string) => (
                      <MenuItem value={project} key={project}>
                        {project}
                      </MenuItem>
                    ))}
              </Select>
            </FormControl>
          </Grid>
          {/* Right column: upload options */}
          <Grid size={{ lg: 6, md: 6, xs: 12 }} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h4" color="primary">
              Upload options
            </Typography>
            <FormControl
              size="small"
              sx={{ minWidth: 200, maxWidth: 400, marginTop: 1, marginBottom: 1 }}
              variant="standard"
            >
              <InputLabel id="fastq-simple-select-label">Sequence Type</InputLabel>
              <Select
                labelId="fastq-simple-select-label"
                id="fastq-simple-select-label"
                name="fastq"
                value={selectedSeqType}
                onChange={(e) => handleSelectSeqType(e.target.value)}
                disabled={uploadInProgress()}
              >
                {Object.values(SeqType).map((seqType: SeqType) => (
                  <MenuItem value={seqType} key={seqType}>
                    {`${seqTypeNames[seqType]}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography>
              If neither of the below options are selected, the upload will return an error for any
              samples with existing sequences.
            </Typography>
            <FormGroup>
              <Box key="option-skip">
                <FormControlLabel
                  control={
                    <Checkbox
                      color="secondary"
                      checked={selectedSkipForce === SkipForce.Skip}
                      onChange={(e) => handleSelectSkipForce(e, SkipForce.Skip)}
                      name={SkipForce.Skip}
                      disabled={uploadInProgress()}
                    />
                  }
                  label="Skip samples with sequences"
                />
                <Box sx={{ paddingLeft: 4 }}>
                  <Typography variant="body2">
                    Silently skip samples which already have sequences of the same data type,
                    without displaying any errors.
                  </Typography>
                </Box>
              </Box>
              <Box key="option-overwrite">
                <FormControlLabel
                  control={
                    <Checkbox
                      color="secondary"
                      checked={selectedSkipForce === SkipForce.Force}
                      onChange={(e) => handleSelectSkipForce(e, SkipForce.Force)}
                      name={SkipForce.Force}
                      disabled={uploadInProgress()}
                    />
                  }
                  label="Overwrite existing sequences"
                />
                <Box sx={{ paddingLeft: 4 }}>
                  <Typography variant="body2">
                    For any samples with existing sequences of the same data type, disable the old
                    files and upload the new files as replacements.
                  </Typography>
                </Box>
              </Box>
            </FormGroup>
          </Grid>
        </Grid>
        {/* File upload and table */}
        <Grid container alignItems="center" justifyContent="center" paddingTop={1} spacing={5}>
          <Box sx={{ minWidth: 200, maxWidth: 600 }} display={showCsvFileUpload() ? '' : 'none'}>
            <Typography variant="h4" color="primary" paddingBottom={2}>
              Select CSV file (optional)
            </Typography>
            <FileDragDrop
              disabled={uploadInProgress()}
              files={fileListingCsv}
              setFiles={setFileListingCsv}
              validFormats={csvFileValidFormats}
              multiple={false}
              onClear={handleClearCsvFile}
            />
          </Box>
          <Box sx={{ minWidth: 200, maxWidth: 600, display: files.length > 0 ? 'none' : '' }}>
            <Typography variant="h4" color="primary" paddingBottom={2}>
              Select sequence files
            </Typography>
            <FileDragDrop
              ref={fileDragDropRef}
              disabled={!selectedDataOwner}
              files={files}
              setFiles={setFiles}
              validFormats={validFormats(selectedSeqType)}
              multiple
              customValidators={validatorsPerSeqType[selectedSeqType]}
              fileTransform={fileTransformPerSeqType(selectedSeqType)}
            />
          </Box>
          {files.length > 0 && (
            <Stack paddingTop={1}>
              {seqUploadRowStates.some((state) => activeSeqUploadStates.includes(state)) && (
                <Alert severity="warning">
                  <Typography variant="body2">
                    Uploading; do not navigate away from this page until all files have been
                    uploaded.
                  </Typography>
                </Alert>
              )}
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} size="small" aria-label="simple table">
                  <TableHead>
                    {seqUploadRows.length > 0 && files.length > 0 && renderUploadHeader()}
                  </TableHead>
                  <TableBody>
                    {files.length > 0 &&
                      seqUploadRows.map((sur) => (
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
              {files.length > 0 && (
                <Grid
                  container
                  alignItems="center"
                  justifyContent="right"
                  size={12}
                  paddingTop={2}
                  paddingBottom={6}
                >
                  <>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={handleUpload}
                      disabled={uploadInProgress() || uploadFinished() || csvErrors.length > 0}
                    >
                      Upload All
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleClearSampleFiles}
                      disabled={uploadInProgress()}
                    >
                      Clear Files
                    </Button>
                  </>
                </Grid>
              )}
            </Stack>
          )}
        </Grid>
      </Box>
    </>
  );
}

export default UploadSequences;
