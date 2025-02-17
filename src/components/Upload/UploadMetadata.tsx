import React, {ChangeEvent, useEffect, useRef, useState} from 'react';
import {
  Backdrop,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Drawer,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  InputLabel,
  LinearProgress,
  Link,
  List,
  ListItemText,
  MenuItem,
  Select,
  Tooltip,
  Typography
} from '@mui/material';
import {FileUpload, HelpOutline, ListAlt, Rule} from '@mui/icons-material';
import {getUserProformas, uploadSubmissions, validateSubmissions} from '../../utilities/resourceUtils';
import {Proforma} from '../../types/dtos';
import LoadingState from '../../constants/loadingState';
import FileDragDrop from './FileDragDrop';
import {useApi} from '../../app/ApiContext';
import {ResponseObject} from '../../types/responseObject.interface';
import {ResponseMessage} from '../../types/apiResponse.interface';
import {ResponseType} from '../../constants/responseType';
import {DropFileUpload} from "../../types/DropFileUpload";
import Validation from "../Validation/Validation";

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
    label: 'Update existing samples',
    description: 'Add or update metadata for existing samples. If this is selected, you cannot include new samples in the upload, but may use proformas that do not include Owner_group.',
  },
];

const validateMessage = `This was a validation only. Please uncheck the &quot;Validate only&quot; option and upload to load data into ${import.meta.env.VITE_BRANDING_NAME}.`
const validFormats = {
  '.csv': 'text/csv',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

function UploadInstructions({ setDrawerOpen }: any) {
  return (
    <Box
      sx={{ maxWidth: 600, padding: 6, borderLeft: 6, borderColor: 'secondary.main', height: '100%' }}
      role="presentation"
      onClick={() => setDrawerOpen(false)}
      onKeyDown={() => setDrawerOpen(false)}
    >
      <ListAlt fontSize="large" color="primary" />
      <Typography variant="h4" color="primary">
        Upload Instructions
      </Typography>
      <br />
      <Typography>Please use the supplied proforma to submit metadata for samples.</Typography>
      <br />
      Metadata can be submitted in tabular format, either in CSV or Excel (xlsx) format.
      Files should have extensions
      <code> .csv </code>
      or
      <code> .xlsx</code>
      . If not using the proforma directly,
      ensure that column names in your CSV or Excel file match those in the proforma.
      <br />
      <br />
      Excel proformas include
      <b> three </b>
      worksheets:
      <ul>
        <li>The metadata proforma itself</li>
        <li>A data dictionary, describing the usage of metadata fields</li>
        <li>A type dictionary, specifying allowed values for fields, where applicable</li>
      </ul>
      The first row of data is considered to be the header.
      When using an Excel proforma the first tab will be used as the sample metadata table.
      <br />
      <br />
      Special columns, required in certain proformas, are:
      <ul>
        <li>
          <b>Seq_ID</b>
          , used as an identifier to match row metadata to sequence data
        </li>
        <li>
          <b>Owner_group</b>
          , used to assign the sample ownership.
          This will affect edit rights over the data.
          Usually a sample will be owned by the Owner group for its organisation
          (for instance, the MDU-Owner group).
        </li>
        <li>
          <b>Shared_groups</b>
          , used to determine who will have permission to view the sample metadata.
          Samples may be shared with multiple groups.
          If a sample is uploaded with an empty Shared_groups value,
          it will not be shared with anyone except the owner group.
        </li>
      </ul>
    </Box>
  );
}

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrollRef = useRef<null | HTMLDivElement>(null);
  const { token, tokenLoading } = useApi();

  const toggleDrawer =
    (open: boolean) =>
      (event: React.KeyboardEvent | React.MouseEvent) => {
        if (
          event.type === 'keydown' &&
        ((event as React.KeyboardEvent).key === 'Tab' ||
          (event as React.KeyboardEvent).key === 'Shift')
        ) {
          return;
        }
        setDrawerOpen(open);
      };

  useEffect(() => {
    setProformaStatus(LoadingState.LOADING);
    const getProformas = async () => {
      const proformaResponse: ResponseObject = await getUserProformas(token);
      if (proformaResponse.status === ResponseType.Success) {
        setProformas(proformaResponse.data);
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
    // Scroll vaidation or upload response messages into view
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

    const submissionResponse : ResponseObject = options.validate ?
      await validateSubmissions(formData, optionString, token)
      : await uploadSubmissions(formData, optionString, token);

    let newMessages = [...submissionResponse.messages ?? []]
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

        } as ResponseMessage)
      }
    } else {
      setSubmission({
        ...submission,
        status: LoadingState.ERROR,
        messages: submissionResponse.messages,
      });
    }
    setMessages(newMessages)
  };
  useEffect(() => {
    // Every time file or option change, reset loading state of submission to idle
    setSubmission({
      ...submission,
      status: LoadingState.IDLE,
      messages: [],
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, options]);

  return (
    <>
      <Grid container spacing={2} sx={{ paddingBottom: 4 }} justifyContent="space-between" alignItems="center">
        <Grid item lg={9} md={12}>
          <Typography variant="h2" paddingBottom={1} color="primary">Upload Metadata</Typography>
          <Typography variant="subtitle2" color="primary">
            Please use the supplied proforma to submit metadata for samples.
            Metadata can be submitted in tabular format, either in CSV or Excel (xlsx) format.
            Files should have extensions
            <code> .csv </code>
            or
            <code> .xlsx</code>
            . If not using the proforma directly,
            ensure that column names in your CSV or Excel file match those in the proforma.
          </Typography>
        </Grid>
        <Grid item>
          <Chip
            icon={<HelpOutline />}
            label="View upload instructions"
            onClick={toggleDrawer(true)}
          />
        </Grid>
      </Grid>
      <Grid container spacing={6} alignItems="stretch" sx={{ paddingBottom: 6 }}>
        <Grid item lg={3} md={12} xs={12} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h4" color="primary">Select proforma </Typography>
          <Tooltip title={proformaStatusMessage} placement="left" arrow>
            <FormControl
              error={proformaStatus === LoadingState.ERROR}
              size="small"
              sx={{ minWidth: 200, marginTop: 2, marginBottom: 2 }}
              variant="standard"
            >
              <InputLabel id="proforma-simple-select-label">Proforma</InputLabel>
              <Select
                labelId="proforma-simple-select-label"
                id="proforma-simple-select-label"
                label="Proforma"
                name="proforma"
                value={selectedProforma?.abbreviation || ''}
                onChange={(e) => handleSelectProforma(e.target.value)}
              >
                { proformas.map((proforma: Proforma) => (
                  <MenuItem
                    value={proforma.abbreviation}
                    key={proforma.abbreviation}
                  >
                    {`${proforma.abbreviation} : ${proforma.name}`}
                  </MenuItem>
                )) }
                { proformas.length === 0 ? (
                  <MenuItem disabled>No proformas available</MenuItem>
                ) : null}
              </Select>
              {proformaStatus === LoadingState.LOADING
                ? (
                  <LinearProgress
                    color="secondary"
                  />
                )
                : null }
            </FormControl>
          </Tooltip>
          { selectedProforma ? (
            <List>
              <Link href={`/proformas/${selectedProforma?.abbreviation}`} color="secondary.dark">
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
        <Grid item lg={4} md={12} xs={12} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h4" color="primary">Select metadata file</Typography>
          <FileDragDrop 
            files={files} 
            setFiles={setFiles} 
            validFormats={validFormats} 
            multiple={false} 
            calculateHash={false} 
            hideAfterDrop={false}
            customValidators={[]}
          ></FileDragDrop>
        </Grid>
        <Grid item lg={5} md={12} xs={12} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h4" color="primary">Select upload options</Typography>
          <FormGroup>
            { uploadOptions.map(
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
                    label={<b>{uploadOption.label}</b>}
                  />
                  <Box sx={{ paddingLeft: 4 }}>
                    {uploadOption.description}
                  </Box>
                </Box>
              ),
            ) }
          </FormGroup>
        </Grid>
        <Grid item container direction="row-reverse">
          { options.validate ? (
            <Button
              variant="contained"
              disabled={!selectedProforma || files.length === 0}
              endIcon={<Rule />}
              onClick={() => handleSubmit()}
            >
              Validate metadata
            </Button>
          )
            : (
              <Button
                variant="contained"
                disabled={!selectedProforma || files.length === 0}
                endIcon={<FileUpload />}
                onClick={() => handleSubmit()}
              >
                Upload metadata
              </Button>
            )}
        </Grid>
      </Grid>
      <div ref={scrollRef}>
        {(
          submission.status === LoadingState.SUCCESS ||
          submission.status === LoadingState.ERROR
        ) ? (
          <Validation 
            messages={messages} 
            title={ options.validate ? "Validation status" : "Upload status"}
            showTitle={true}
          />
          )
          : null}
      </div>
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        <UploadInstructions setDrawerOpen={setDrawerOpen} />
      </Drawer>
      <Backdrop
        sx={{
          color: 'var(--background-colour)',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
        open={submission.status === LoadingState.LOADING}
      >
        <Grid container spacing={2} direction="column" alignItems="center" justifyContent="center">
          <Grid item>
            <Typography>{options.validate ? 'Validating metadata... ' : 'Uploading metadata... '}</Typography>
          </Grid>
          <Grid item>
            <CircularProgress color="inherit" />
          </Grid>
        </Grid>
      </Backdrop>
    </>
  );
}
export default UploadMetadata;
