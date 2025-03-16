import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import {
  Backdrop,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  Link,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { FileUpload, Rule } from '@mui/icons-material';
import LoadingState from '../../constants/loadingState';
import FileDragDrop from './FileDragDrop';
import { ResponseMessage } from '../../types/apiResponse.interface';
import { DropFileUpload } from '../../types/DropFileUpload';
import Validation from '../Validation/Validation';
import HelpSidebar from '../Help/HelpSidebar';
import UploadMetadataHelp from './UploadMetadataHelp';

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

const validateMessage = `This was a validation only. Please uncheck the &quot;Validate only&quot; option and upload to load data into ${import.meta.env.VITE_BRANDING_NAME}.`;
const validFormats = {
  '.csv': 'text/csv',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

function UploadMetadata() {
  const [submission, setSubmission] = useState({
    status: LoadingState.IDLE,
    messages: [] as ResponseMessage[] | undefined,
  });
  const [messages, setMessages] = useState<ResponseMessage[]>([]);
  const [options, setOptions] = useState({
    'validate': false,
    'blank': false,
    'append': false,
  } as Options);
  const [files, setFiles] = useState<DropFileUpload[]>([]);
  const [fileValidated, setFileValidated] = useState(false);
  const scrollRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    // Scroll vaidation or upload response messages into view
    if (submission.messages?.length !== 0) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [submission.messages]);

  // Handle upload option change
  const handleOptionChange = (event: ChangeEvent<HTMLInputElement>) => {
    setOptions({
      ...options,
      [event.target.name]: event.target.checked,
    });
  };

  // Handle upload submission
  const handleSubmit = async () => {
    // TODO this will need to do something entirely different - 
    // client-side validation and inserting data into the project redux state
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
      <Typography variant="h2" paddingBottom={1} color="primary">Upload Metadata</Typography>
      <Grid container spacing={2} sx={{ paddingBottom: 4 }} justifyContent="space-between" alignItems="center">
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
      <Grid container spacing={6} alignItems="stretch" sx={{ paddingBottom: 6 }}>
        <Grid size={{ lg: 4, md: 12, xs: 12 }} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h4" color="primary">Select metadata file</Typography>
          <FileDragDrop
            files={files}
            setFiles={setFiles}
            validFormats={validFormats}
            validated={fileValidated}
            setValidated={setFileValidated}
          />
        </Grid>
        <Grid size={{ lg: 5, md: 12, xs: 12 }} sx={{ display: 'flex', flexDirection: 'column' }}>
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
      </Grid>
      <Grid container justifyContent="flex-end">
        { options.validate ? (
          <Button
            variant="contained"
            disabled={files.length === 0}
            endIcon={<Rule />}
            onClick={() => handleSubmit()}
          >
            Validate metadata
          </Button>
        )
          : (
            <Button
              variant="contained"
              disabled={files.length === 0}
              endIcon={<FileUpload />}
              onClick={() => handleSubmit()}
            >
              Upload metadata
            </Button>
          )}
      </Grid>
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
          color: 'var(--background-colour)',
          zIndex: (theme) => theme.zIndex.drawer + 1,
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
