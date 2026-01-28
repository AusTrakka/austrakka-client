import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import {
  Backdrop,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  LinearProgress,
  Link,
  List,
  ListItemText,
  MenuItem,
  Select,
  Tooltip,
  Typography,
  Alert,
  FormHelperText,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { FileUpload, Rule } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getUserProformas, uploadSubmissions, validateSubmissions, getProjectList } from '../../utilities/resourceUtils';
import { Proforma, Project } from '../../types/dtos';
import LoadingState from '../../constants/loadingState';
import FileDragDrop from './FileDragDrop';
import { useApi } from '../../app/ApiContext';
import { ResponseObject } from '../../types/responseObject.interface';
import { ResponseMessage } from '../../types/apiResponse.interface';
import { ResponseType } from '../../constants/responseType';
import { DropFileUpload } from '../../types/DropFileUpload';
import { Validation } from '../Validation/Validation';
import HelpSidebar from '../Help/HelpSidebar';
import UploadMetadataHelp from './UploadMetadataHelp';
import { OrgDescriptor } from '../../types/sequploadtypes';
import { getSharableProjects, getUploadableOrgs } from '../../utilities/uploadUtils';
import { selectUserState, UserSliceState } from '../../app/userSlice';
import { useAppSelector } from '../../app/store';
import { Theme } from '../../assets/themes/theme';

interface Options {
  validate: boolean,
  blank: boolean,
  append: boolean
}

const uploadOptions = [
  {
    name: 'validate',
    label: 'Validate only',
    description: 'Do not upload metadata, just see validation errors and warnings. This is not a full dry run: it will validate correctness of data against allowed values and types, but will not give a preview of data changes.',
  },
  {
    name: 'blank',
    label: 'Blank cells will delete',
    description: 'Use blank cells in your CSV / XLSX file to indicate that the current cell content should be deleted. If this is not selected, blank cells in the upload will be ignored.',
  },
  {
    name: 'append',
    label: 'Update only existing samples',
    description: 'Add or update metadata for existing samples only; do not create new samples. Will check that all Seq_IDs in the upload are known.',
  },
];

const validateMessage = `This was a validation only. Please uncheck the &quot;Validate only&quot; option and upload to load data into ${import.meta.env.VITE_BRANDING_NAME}.`;
const validFormats = {
  '.csv': 'text/csv',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

function UploadMetadata() {
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [proformaStatus, setProformaStatus] = useState(LoadingState.IDLE);
  const [submission, setSubmission] = useState({
    status: LoadingState.IDLE,
    messages: [] as ResponseMessage[] | undefined,
  });
  const [messages, setMessages] = useState<ResponseMessage[]>([]);
  const [proformaStatusMessage, setProformaStatusMessage] = useState('');
  const [selectedProforma, setSelectedProforma] = useState<Proforma>();
  const [options, setOptions] = useState({
    'validate': false,
    'blank': false,
    'append': false,
  } as Options);
  const [files, setFiles] = useState<DropFileUpload[]>([]);
  const [fileValidated, setFileValidated] = useState(false);
  const [availableDataOwners, setAvailableDataOwners] = useState<string[]>([]); // Org abbreviations
  const [selectedDataOwner, setSelectedDataOwner] = useState<string | null>(null);
  const [projectAbbrevs, setProjectAbbrevs] = useState<string[]>([]);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [selectedProjectShare, setSelectedProjectShare] = useState<string[]>([]);
  const [pageErrorMsg, setPageErrorMsg] = useState<string | null>(null);
  const scrollRef = useRef<null | HTMLDivElement>(null);
  const user: UserSliceState = useAppSelector(selectUserState);
  const { token, tokenLoading } = useApi();
  const theme = useTheme();

  const canUpload = selectedDataOwner && selectedProforma && files.length > 0;

  // Data owner
  useEffect(() => {
    if (user.loading !== LoadingState.SUCCESS) {
      setAvailableDataOwners([]);
      return;
    }
    const orgs: OrgDescriptor[] = getUploadableOrgs(user.groupRoles ?? []);
    setAvailableDataOwners(orgs.map((org: OrgDescriptor) => org.abbreviation));
    if (orgs.some(org => org.abbreviation === user.orgAbbrev)) {
      setSelectedDataOwner(user.orgAbbrev);
    } else if (orgs.length > 0) {
      setSelectedDataOwner(orgs[0].abbreviation);
    }
    if (orgs.length === 0) {
      setPageErrorMsg('Either you do not have uploader permissions in any organisation, or your permissions ' +
        'could not be properly loaded. Please contact an admin.');
    }
  }, [user.groupRoles, user.loading, user.orgAbbrev]);

  // Projects
  useEffect(() => {
    if (user.loading !== LoadingState.SUCCESS) {
      setAvailableProjects([]);
      return;
    }
    const abbrevs: string[] = getSharableProjects(user.groupRoles ?? []);
    setProjectAbbrevs(abbrevs);
  }, [user.groupRoles, user.loading, user.orgAbbrev]);

  useEffect(() => {
    async function getProjects() {
      const projectResponse : ResponseObject<Project[]> = await getProjectList(token);
      if (projectResponse.status === ResponseType.Success) {
        const filteredProjects = projectResponse.data?.filter(
          ({ clientType }) => !clientType || clientType === import.meta.env.VITE_BRANDING_ID,
        );

        const abbrevs = new Set(projectAbbrevs);
        const projects = filteredProjects?.filter(project => abbrevs.has(project.abbreviation));
        setAvailableProjects(projects ?? []);
      }
    }
    if (
      tokenLoading !== LoadingState.IDLE &&
      tokenLoading !== LoadingState.LOADING &&
      projectAbbrevs.length > 0
    ) {
      getProjects();
    }
  }, [token, tokenLoading, projectAbbrevs]);

  useEffect(() => {
    setProformaStatus(LoadingState.LOADING);
    const getProformas = async () => {
      const proformaResponse: ResponseObject = await getUserProformas(token);
      if (proformaResponse.status === ResponseType.Success) {
        const sortedProforma = proformaResponse.data.sort((a: Proforma, b: Proforma) =>
          a.abbreviation.localeCompare(b.abbreviation));
        setProformas(sortedProforma);
        setProformaStatus(LoadingState.SUCCESS);
      } else {
        setProformaStatusMessage(proformaResponse.message!);
        setProformaStatus(LoadingState.ERROR);
      }
    };
    if (tokenLoading !== LoadingState.LOADING && tokenLoading !== LoadingState.IDLE) {
      getProformas();
    }
  }, [token, tokenLoading]);

  useEffect(() => {
    // Scroll validation or upload response messages into view
    if (submission.messages?.length !== 0) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [submission.messages]);

  // Handle proforma selection
  const handleSelectProforma = (proformaAbbrev: string) => {
    // Find selected proforma object
    const proformaObj = proformas.filter(proforma => proforma.abbreviation === proformaAbbrev);
    setSelectedProforma(proformaObj[0]);
  };

  // Handle upload option change
  const handleOptionChange = (event: ChangeEvent<HTMLInputElement>) => {
    setOptions({
      ...options,
      [event.target.name]: event.target.checked,
    });
  };

  // Handle upload submission
  const handleSubmit = async () => {
    setSubmission({
      ...submission,
      status: LoadingState.LOADING,
    });
    const optionString = `?appendMode=${options.append}&deleteOnBlank=${options.blank}`;
    const formData = new FormData();
    formData.append('file', files[0].file!);
    formData.append('proforma-abbrev', selectedProforma!.abbreviation);

    const submissionResponse: ResponseObject = options.validate
      ? await validateSubmissions(
        formData,
        optionString,
        token,
        selectedDataOwner!,
        selectedProjectShare,
      )
      : await uploadSubmissions(
        formData,
        optionString,
        token,
        selectedDataOwner!,
        selectedProjectShare,
      );

    const newMessages = [...submissionResponse.messages ?? []];
    if (submissionResponse.status === ResponseType.Success) {
      setSubmission({
        ...submission,
        status: LoadingState.SUCCESS,
        messages: submissionResponse.messages,
      });
      if (options.validate) {
        newMessages.push({
          ResponseType: ResponseType.Warning,
          ResponseMessage: validateMessage,

        } as ResponseMessage);
      }
    } else {
      setSubmission({
        ...submission,
        status: LoadingState.ERROR,
        messages: submissionResponse.messages,
      });
    }
    setMessages(newMessages);
  };
  useEffect(() => {
    // Every time file or option changes, reset loading state of submission to idle
    setSubmission({
      ...submission,
      status: LoadingState.IDLE,
      messages: [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, options]);

  return (
    <>
      <Typography variant="h2" paddingBottom={1} color="primary">Upload Metadata</Typography>
      {/* Top section */}
      <Grid container spacing={2} sx={{ paddingBottom: 4 }} justifyContent="space-between" alignItems="center">
        {pageErrorMsg && (
          <Grid size={12}>
            <Alert severity="error">
              {pageErrorMsg}
            </Alert>
          </Grid>
        )}
        <Grid size={{ md: 12, lg: 9 }}>
          <Typography variant="subtitle2" paddingBottom={1}>
            Please select a proforma for validation, and select a metadata file to upload.
            Metadata can be submitted in tabular format, either in CSV or Excel (xlsx) format.
            <br />
            If you would prefer to upload metadata using the command line,&nbsp;
            <Link
              href={`${import.meta.env.VITE_DOCS_URL}/docs/AusTrakka CLI/CLI-metadata-upload`}
              target="_blank"
              color="primary.light"
            >
              refer to the CLI documentation.
            </Link>
          </Typography>
        </Grid>
        <Grid>
          <HelpSidebar
            content={UploadMetadataHelp()}
            title="Upload Instructions"
            chipLabel="View upload instructions"
          />
        </Grid>
      </Grid>
      {/* Main section of page, containing 3 columns and lower elements */}
      <Grid container spacing={6} alignItems="stretch" sx={{ paddingBottom: 1 }}>
        {/* Left column: org, projects, proforma */}
        <Grid size={{ lg: 6, md: 6, xs: 12 }} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h4" color="primary" paddingBottom={2}>Data ownership and validation</Typography>
          <FormControl
            size="small"
            sx={{ minWidth: 200, maxWidth: 400, marginBottom: 3 }}
            variant="standard"
          >
            <InputLabel
              id="select-data-owner-label"
              sx={{ color: selectedDataOwner ? 'inherit' : theme.palette.error.main }}
            >
              Data Owner
            </InputLabel>
            <Select
              labelId="select-data-owner-label"
              id="select-data-owner"
              value={selectedDataOwner || ''}
              onChange={(e) => setSelectedDataOwner(e.target.value)}
            >
              {
                availableDataOwners.map((org: string) => (
                  <MenuItem
                    value={org}
                    key={org}
                  >
                    {org}
                  </MenuItem>
                ))
              }
            </Select>
            <FormHelperText>
              Required
            </FormHelperText>
          </FormControl>
          <Typography variant="h4" color="primary">Sharing</Typography>
          <FormControl
            size="small"
            sx={{ minWidth: 200, maxWidth: 400, marginBottom: 3 }}
            variant="standard"
          >
            <InputLabel id="select-project-share-label">Share with Projects</InputLabel>
            <Select
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
                  <MenuItem
                    value={project.abbreviation}
                    key={project.abbreviation}
                  >
                    {`${project.abbreviation} : ${project.name}`}
                  </MenuItem>
                ))
                : projectAbbrevs.map((project: string) => (
                  <MenuItem
                    value={project}
                    key={project}
                  >
                    {project}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <Typography variant="h4" color="primary">Select proforma</Typography>
          <Tooltip title={proformaStatusMessage} placement="left" arrow>
            <FormControl
              error={proformaStatus === LoadingState.ERROR}
              size="small"
              sx={{ minWidth: 200, maxWidth: 400, marginBottom: 3 }}
              variant="standard"
            >
              <InputLabel
                id="proforma-simple-select-label"
                sx={{ color: selectedProforma ? 'inherit' : theme.palette.error.main }}
              >
                Proforma
              </InputLabel>
              <Select
                labelId="proforma-simple-select-label"
                id="proforma-simple-select-label"
                label="Proforma"
                name="proforma"
                value={selectedProforma?.abbreviation || ''}
                onChange={(e) => handleSelectProforma(e.target.value)}
              >
                {proformas.map((proforma: Proforma) => (
                  <MenuItem
                    value={proforma.abbreviation}
                    key={proforma.abbreviation}
                  >
                    {`${proforma.abbreviation} : ${proforma.name}`}
                  </MenuItem>
                ))}
                {proformas.length === 0 ? (
                  <MenuItem disabled>No proformas available</MenuItem>
                ) : null}
              </Select>
              {proformaStatus === LoadingState.LOADING
                ? (
                  <LinearProgress
                    color="secondary"
                  />
                )
                : null}
              <FormHelperText>
                Required
              </FormHelperText>
            </FormControl>
          </Tooltip>
          {selectedProforma ? (
            <List>
              <Link href={`/proformas/${selectedProforma?.abbreviation}/${selectedProforma?.version}`} color="secondary.dark">
                View or download proforma
              </Link>
              <ListItemText
                primary="Proforma name"
                secondary={selectedProforma?.name}
                key="name"
              />
              <ListItemText
                primary="Proforma abbreviation"
                secondary={selectedProforma?.abbreviation}
                key="abbrev"
              />
            </List>
          ) : null}
        </Grid>
        {/* Right column: upload options */}
        <Grid size={{ lg: 6, md: 6, xs: 12 }} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h4" color="primary">Select upload options</Typography>
          <FormGroup>
            {uploadOptions.map(
              (uploadOption: { name: string; label: string; description: string; }) => (
                <Box sx={{ paddingBottom: 1 }} key={uploadOption.name}>
                  <FormControlLabel
                    control={(
                      <Checkbox
                        color="secondary"
                        checked={options[uploadOption.name as keyof Options]}
                        onChange={handleOptionChange}
                        name={uploadOption.name}
                      />
                    )}
                    label={uploadOption.label}
                  />
                  <Box sx={{ paddingLeft: 4 }}>
                    <Typography variant="body2">{uploadOption.description}</Typography>
                  </Box>
                </Box>
              ),
            )}
          </FormGroup>
        </Grid>
      </Grid>
      {/* Lower section: file selector */}
      <Grid container alignItems="center" justifyContent="center">
        <Box sx={{ minWidth: 350, maxWidth: 600 }}>
          <Typography variant="h4" color="primary" paddingTop={1}>Select metadata file</Typography>
          <FileDragDrop
            files={files}
            setFiles={setFiles}
            validFormats={validFormats}
            validated={fileValidated}
            setValidated={setFileValidated}
          />
          {
            canUpload && !options.validate && !options.append &&
            selectedProjectShare.length === 0 && (
              <Alert severity="warning" sx={{ marginBottom: 1 }}>
                No projects selected; newly created sample records will not be part of any project.
              </Alert>
            )
          }
          {options.validate ? (
            <Button
              variant="contained"
              sx={{ width: '100%', marginBottom: 3, backgroundColor: Theme.SecondaryLightGreen }}
              disabled={!canUpload}
              endIcon={<Rule />}
              onClick={() => handleSubmit()}
            >
              Validate metadata
            </Button>
          )
            : (
              <Button
                variant="contained"
                sx={{ width: '100%', marginBottom: 3, backgroundColor: Theme.SecondaryLightGreen }}
                disabled={!canUpload}
                endIcon={<FileUpload />}
                onClick={() => handleSubmit()}
              >
                Upload metadata
              </Button>
            )}
        </Box>
      </Grid>
      <Grid container justifyContent="flex-end" />
      <div ref={scrollRef}>
        {(
          submission.status === LoadingState.SUCCESS ||
          submission.status === LoadingState.ERROR
        ) ? (
          <Validation
            messages={messages}
            title={options.validate ? 'Validation status' : 'Upload status'}
            showTitle
          />
          )
          : null}
      </div>
      <Backdrop
        sx={{
          color: Theme.Background,
          zIndex: theme.zIndex.drawer + 1,
        }}
        open={submission.status === LoadingState.LOADING}
      >
        <Grid container spacing={2} direction="column" alignItems="center" justifyContent="center">
          <Grid>
            <Typography>{options.validate ? 'Validating metadata... ' : 'Uploading metadata... '}</Typography>
          </Grid>
          <Grid>
            <CircularProgress color="inherit" />
          </Grid>
        </Grid>
      </Backdrop>
    </>
  );
}
export default UploadMetadata;
