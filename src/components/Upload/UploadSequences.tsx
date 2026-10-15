import ErrorIcon from '@mui/icons-material/Error';
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
import { useSnackbar } from 'notistack';
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
  createPairedSeqUploadRows,
  createPairedSeqUploadRowsFromCsv,
  createSingleSeqUploadRows,
  createSingleSeqUploadRowsFromCsv,
  findDuplicateSeqIds,
  getSampleSharableProjects,
  getUploadableSeqOrgs,
  parseSeqUploadCsvPairs,
  parseSeqUploadCsvSingles,
  splitFastaByContig,
} from '../../utilities/uploadUtils';
import HelpSidebar from '../Help/HelpSidebar';
import { UploadErrorMessages } from './Constants/UploadMessages';
import CsvErrorsTable from './CsvErrorsTable';
import FileDragDrop from './FileDragDrop';
import FileUploadButton from './FileUploadButton';
import {
  validateAllHaveSampleNamesWithOneFileOnly,
  validateEvenNumberOfFiles,
  validateNoDuplicateFilenames,
} from './fileUploadValidators';
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
  [SeqType.FastqIllPe]: [validateEvenNumberOfFiles, validateNoDuplicateFilenames],
  [SeqType.FastqIllSe]: [validateNoDuplicateFilenames, validateAllHaveSampleNamesWithOneFileOnly],
  [SeqType.FastqOnt]: [validateNoDuplicateFilenames, validateAllHaveSampleNamesWithOneFileOnly],
  [SeqType.FastaAsm]: [validateNoDuplicateFilenames, validateAllHaveSampleNamesWithOneFileOnly],
  // FastaCns is a special case: validation is applied during file-splitting transform
  [SeqType.FastaCns]: [],
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
  const [pageErrorMsg, setPageErrorMsg] = useState<string | null>(null);
  const [dismissedCsvItems, setDismissedCsvItems] = useState<Set<string>>(new Set());
  const visibleCsvErrors = useMemo(
    () =>
      csvErrors
        .map((err) => ({ ...err, items: err.items.filter((item) => !dismissedCsvItems.has(item)) }))
        .filter((err) => err.items.length > 0),
    [csvErrors, dismissedCsvItems],
  );
  const hasBlockingCsvErrors = visibleCsvErrors.length > 0;
  const duplicateSeqIds = useMemo(() => findDuplicateSeqIds(seqUploadRows), [seqUploadRows]);
  const hasDuplicateSeqIds = duplicateSeqIds.size > 0;

  const [useCsvFile, setUseCsvFile] = useState<boolean>(false);

  const fileDragDropRef = useRef<any>(null);
  const user: UserSliceState = useAppSelector(selectUserState);

  const [fileListingCsv, setFileListingCsv] = useState<File[]>([]);
  const [csvUploadPairs, setCsvUploadPairs] = useState<SeqUploadCsvPair[]>([]);
  const [csvUploadSingles, setCsvUploadSingles] = useState<SeqUploadCsvSingle[]>([]);

  const { compact } = useCompactMode();
  const { token, tokenLoading } = useApi();
  const { enqueueSnackbar } = useSnackbar();

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

  const dismissCsvErrors = useCallback((filenames: string[]) => {
    const toRemove = new Set(filenames);
    setDismissedCsvItems((prev) => new Set([...prev, ...toRemove]));
  }, []);

  useEffect(() => {
    async function processPairingFile() {
      setDismissedCsvItems(new Set());
      if (fileListingCsv.length === 0) {
        setCsvUploadPairs([]);
        setCsvUploadSingles([]);
        setCsvErrors([]);
        return;
      }
      try {
        if (selectedSeqType === SeqType.FastqIllPe) {
          const pairingRecords = await parseSeqUploadCsvPairs(fileListingCsv[0]);
          setCsvUploadPairs(pairingRecords);
          setUseCsvFile(true);
        } else if (selectedSeqType !== SeqType.FastaCns) {
          const pairingRecords = await parseSeqUploadCsvSingles(fileListingCsv[0]);
          setCsvUploadSingles(pairingRecords);
          setUseCsvFile(true);
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          enqueueSnackbar(e.message, { variant: 'error', autoHideDuration: 8000 });
        } else {
          setPageErrorMsg(UploadErrorMessages.UNEXPECTED_ERROR);
        }
        setFileListingCsv([]);
        setUseCsvFile(false);
      }
    }

    void processPairingFile();
  }, [fileListingCsv, selectedSeqType, enqueueSnackbar]);

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
    let rows: SeqUploadRow[];

    if (rowType === UploadPairedSequenceRow) {
      if (useCsvFile && csvUploadPairs.length > 0) {
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
      if (useCsvFile && csvUploadSingles.length > 0) {
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
  }, [files, selectedSeqType, csvUploadPairs, csvUploadSingles, useCsvFile]);

  const handleSelectSeqType = (seqTypeStr: string) => {
    const seqType = getEnumByValue(SeqType, seqTypeStr) as SeqType;
    setPageErrorMsg(null);
    setFileListingCsv([]);
    setUseCsvFile(false);
    setCsvErrors([]);
    setSelectedSeqType(seqType);
  };

  const handleSelectSkipForce = (event: ChangeEvent<HTMLInputElement>, skipForceStr: string) => {
    let skipForce = SkipForce.None; // the value we will use if box unchecked
    if (event.target.checked) skipForce = getEnumByValue(SkipForce, skipForceStr) as SkipForce;
    setSelectedSkipForce(skipForce);
  };

  const handleToggleCsvFile = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setUseCsvFile(true);
    } else {
      setUseCsvFile(false);
      setCsvErrors([]);
    }
  };

  const fileDragDropOnClear = useCallback(() => {
    setDismissedCsvItems(new Set());
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
    if (uploadInProgress() || hasBlockingCsvErrors) return;

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
      setPageErrorMsg(UploadErrorMessages.PERMISSIONS_REQUIRED);
    }
  }, [user, user.loading, user.orgAbbrev]);

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
          isCsvMode={useCsvFile && fileListingCsv.length > 0}
          isDuplicateSeqId={duplicateSeqIds.has(row.seqId?.trim())}
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
          isCsvMode={useCsvFile && fileListingCsv.length > 0}
          isDuplicateSeqId={duplicateSeqIds.has(row.seqId?.trim())}
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
          {pageErrorMsg && (
            <Grid size={12}>
              <Alert severity="error">{pageErrorMsg}</Alert>
            </Grid>
          )}
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

              {showCsvFileUpload() ? (
                <Box key="option-use-csv">
                  <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          color="secondary"
                          checked={useCsvFile}
                          onChange={(e) => handleToggleCsvFile(e)}
                          name={'useCsvFile'}
                          disabled={uploadInProgress()}
                        />
                      }
                      label="Use file listing CSV"
                    />
                    <Box display={'flex'} flexDirection={'row'} gap={0.5}>
                      <FileUploadButton
                        onChange={(f) => setFileListingCsv(f)}
                        disabled={uploadInProgress()}
                        validFormats={csvFileValidFormats}
                        multiple={false}
                        sx={{ size: 'small' }}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ paddingLeft: 4 }}>
                    <Typography variant="body2">
                      Use a CSV file to match any specified sample files against a sample name. When
                      disabled, matches will be determined based on file names.
                    </Typography>
                    <Box
                      sx={{
                        minWidth: 200,
                        maxWidth: 600,
                        maxHeight: 200,
                        mt: 1,
                        display: fileListingCsv.length > 0 ? undefined : 'none',
                      }}
                    >
                      <Stack direction="row" alignItems="center">
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ flexGrow: 1, minWidth: 0 }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            noWrap
                            sx={{ maxWidth: 200 }}
                          >
                            {fileListingCsv[0]?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            • {fileListingCsv[0]?.size} bytes
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>
                  </Box>
                </Box>
              ) : null}
            </FormGroup>
          </Grid>
        </Grid>
        {/* File upload and table */}
        <Grid
          container
          alignItems="center"
          justifyContent="center"
          paddingTop={1}
          spacing={5}
          marginTop={4}
        >
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
              onClear={fileDragDropOnClear}
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
              {hasBlockingCsvErrors && files.length > 0 && (
                <Box>
                  <Paper>
                    <Typography fontSize={'1rem'} variant={'h6'} sx={{ padding: '10px' }}>
                      CSV File Errors
                    </Typography>
                    <CsvErrorsTable
                      onChange={(f) => dismissCsvErrors(f)}
                      errors={visibleCsvErrors}
                    />
                  </Paper>
                  <Grid
                    container
                    alignItems="center"
                    justifyContent="right"
                    size={12}
                    paddingTop={2}
                    paddingBottom={4}
                    gap={1}
                  >
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => dismissCsvErrors(visibleCsvErrors.flatMap((err) => err.items))}
                    >
                      <Typography variant="button" fontSize=".8rem">
                        Remove All
                      </Typography>
                    </Button>
                  </Grid>
                </Box>
              )}

              {seqUploadRows.length === 0 && files.length > 0 && useCsvFile ? (
                <Paper sx={{ minWidth: 650 }}>
                  <Box
                    display={'flex'}
                    flexDirection={'row'}
                    gap={1}
                    alignItems={'center'}
                    sx={{ padding: '10px' }}
                  >
                    <ErrorIcon color="error" />
                    <Typography variant={'body1'}>
                      {visibleCsvErrors.length > 0
                        ? 'All added files are invalid, please see errors above.'
                        : 'All added files are invalid. Remove or replace the CSV listing file, or clear all files and upload new ones.'}
                    </Typography>
                  </Box>
                </Paper>
              ) : (
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
              )}

              {files.length > 0 && (
                <Grid
                  container
                  alignItems="center"
                  justifyContent="right"
                  size={12}
                  paddingTop={2}
                  paddingBottom={12}
                  gap={1}
                >
                  <Box sx={{ marginRight: 'auto' }}>
                    {hasDuplicateSeqIds ? (
                      <Box display={'flex'} flexDirection={'row'} gap={1} alignItems={'center'}>
                        <ErrorIcon color="error" />
                        <Typography variant={'subtitle2'}>Seq ID must be unique</Typography>
                      </Box>
                    ) : null}
                  </Box>
                  <>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={handleUpload}
                      disabled={
                        uploadInProgress() ||
                        uploadFinished() ||
                        hasBlockingCsvErrors ||
                        hasDuplicateSeqIds
                      }
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
