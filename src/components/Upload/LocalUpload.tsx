import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import {
  Backdrop,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { FileUpload, Rule } from '@mui/icons-material';
import Papa from 'papaparse';
import LoadingState from '../../constants/loadingState';
import FileDragDrop from './FileDragDrop';
import { ResponseMessage } from '../../types/apiResponse.interface';
import { DropFileUpload } from '../../types/DropFileUpload';
import Validation from '../Validation/Validation';
import { useAppDispatch } from '../../app/store';
import { addMetadata } from '../../app/projectMetadataSlice';
import { Sample } from '../../types/sample.interface';
import { ResponseType } from '../../constants/responseType';
import { buildFieldListAndUpdateData } from '../../utilities/standaloneClientUtils';

interface Options {
  validate: boolean,
  blank: boolean,
}

const uploadOptions = [
  { name: 'validate',
    label: 'Validate only',
    description: 'Do not ingest metadata, just see validation errors and warnings.' },
  {
    name: 'blank',
    label: 'Blank cells will delete',
    description: 'Use blank cells in your CSV / XLSX file to indicate that the current cell content should be deleted. If this is not selected, blank cells in the upload will be ignored.',
  },
];

const validateMessage = `This was a validation only. Please uncheck the &quot;Validate only&quot; option and upload to load data into ${import.meta.env.VITE_BRANDING_NAME}.`;
const validFormats = {
  '.csv': 'text/csv',
  // '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

function LocalUpload() {
  const dispatch = useAppDispatch();
  const [submission, setSubmission] = useState({
    status: LoadingState.IDLE,
    messages: [] as ResponseMessage[] | undefined,
  });
  const [options, setOptions] = useState({
    'validate': false,
    'blank': false,
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
  // This component should do the CSV parsing and validation, 
  // as it is async and we want to show errors locally.
  // We should only call the redux action if the data is valid.
  const handleSubmit = async () => {
    // Needs to validate, and insert data into project redux state
    Papa.parse(files[0].file, {
      header: true,
      complete: (result) => {
        console.log(result);

        // TODO need to handle papaparse errors

        const csvData = result.data as Sample[];
        const fieldNames: string[] = result.meta.fields;
        
        if (csvData.length === 0) {
          setSubmission((oldSubmissionState) => ({
            ...oldSubmissionState,
            status: LoadingState.ERROR,
            messages: [{
              ResponseType: ResponseType.Error,
              ResponseMessage: 'File appears to contain no records: no data loaded',
            }],
          }));
          // TODO if we have succeeded, but result.errors is non-empty, show warnings
          return;
        }

        const fields = buildFieldListAndUpdateData(csvData, fieldNames);
        dispatch(addMetadata({ uploadedData: csvData, uploadedFields: fields }));
        
        setSubmission((oldSubmissionState) => ({
          ...oldSubmissionState,
          status: LoadingState.SUCCESS, // TODO how to actually ensure success? check project state?
          messages: [{
            ResponseType: ResponseType.Success,
            ResponseMessage: 'Data loaded',
          }],
        }));
      },
    });
  };
  
  useEffect(() => {
    // Every time file or option changes, reset loading state of submission to idle
    setSubmission((oldSubmissionState) => ({
      ...oldSubmissionState,
      status: LoadingState.IDLE,
      messages: [],
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, options]);

  return (
    <>
      <Typography variant="h2" paddingBottom={1} color="primary">Add Data</Typography>
      <Grid container spacing={2} sx={{ paddingBottom: 4 }} justifyContent="space-between" alignItems="center">
        <Grid size={{ md: 12, lg: 9 }}>
          <Typography variant="subtitle2" paddingBottom={1}>
            Drag-and-drop a sample metadata file to add it to your project.
            Metadata can be added in tabular (CSV) format.
            The Seq_ID column will be used as the unique identifier to match to tree nodes.
          </Typography>
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
            multiple={false}
          />
        </Grid>
        {/* <Grid size={{ lg: 5, md: 12, xs: 12 }} sx={{ display: 'flex', flexDirection: 'column' }}> */}
        {/*  <Typography variant="h4" color="primary">Select metadata options</Typography> */}
        {/*  <FormGroup> */}
        {/*    { uploadOptions.map( */}
        {/*      (uploadOption: { name: string; label: string; description: string; }) => ( */}
        {/*        <Box sx={{ paddingBottom: 1 }} key={uploadOption.name}> */}
        {/*          <FormControlLabel */}
        {/*            control={( */}
        {/*              <Checkbox */}
        {/*                color="secondary" */}
        {/*                checked={options[uploadOption.name as keyof Options]} */}
        {/*                onChange={handleOptionChange} */}
        {/*                name={uploadOption.name} */}
        {/*              /> */}
        {/*        )} */}
        {/*            label={<b>{uploadOption.label}</b>} */}
        {/*          /> */}
        {/*          <Box sx={{ paddingLeft: 4 }}> */}
        {/*            {uploadOption.description} */}
        {/*          </Box> */}
        {/*        </Box> */}
        {/*      ), */}
        {/*    ) } */}
        {/*  </FormGroup> */}
        {/* </Grid> */}
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
              Add metadata
            </Button>
          )}
      </Grid>
      <div ref={scrollRef}>
        {(
          submission.status === LoadingState.SUCCESS ||
          submission.status === LoadingState.ERROR
        ) ? (
          <Validation
            messages={submission.messages ?? []}
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
            <Typography>{options.validate ? 'Validating metadata... ' : 'Adding metadata... '}</Typography>
          </Grid>
          <Grid>
            <CircularProgress color="inherit" />
          </Grid>
        </Grid>
      </Backdrop>
    </>
  );
}
export default LocalUpload;
