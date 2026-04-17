import { FileUpload } from '@mui/icons-material';
import {
  Backdrop,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import Papa from 'papaparse';
import React, { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { addMetadata } from '../../app/projectMetadataSlice';
import { useAppDispatch } from '../../app/store';
import { addTree } from '../../app/treeSlice';
import LoadingState from '../../constants/loadingState';
import { ResponseType } from '../../constants/responseType';
import type { ResponseMessage } from '../../types/apiResponse.interface';
import type { DropFileUpload } from '../../types/DropFileUpload';
import type { DeducedField } from '../../types/dtos';
import type { Sample } from '../../types/sample.interface';
import { buildFieldListAndUpdateData } from '../../utilities/standaloneClientUtils';
import { Validation } from '../Validation/Validation';
import FieldUploadCheck from './FieldUploadCheck';
import FileDragDrop from './FileDragDrop';

interface Options {
  validate: boolean;
  blank: boolean;
}

// TODO add option to use local storage

const getSuffix = (file: DropFileUpload) => `.${file.file.name.split('.').pop() ?? ''}`;

const uploadOptions = [
  {
    name: 'validate',
    label: 'Validate only',
    description: 'Do not ingest metadata, just see validation errors and warnings.',
  },
  {
    name: 'blank',
    label: 'Blank cells will delete',
    description:
      'Use blank cells in your CSV / XLSX file to indicate that the current cell content should be deleted. If this is not selected, blank cells in the upload will be ignored.',
  },
];

const validateMessage = `This was a validation only. Please uncheck the &quot;Validate only&quot; option and upload to load data into ${import.meta.env.VITE_BRANDING_NAME}.`;

const METADATA_FORMATS: Record<string, string> = {
  '.csv': 'text/csv', // TODO tsv, maybe later excel
  // '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};
const TREE_FORMATS: Record<string, string> = {
  '.nwk': 'text/plain',
  '.newick': 'text/plain',
  '.tree': 'text/plain',
};
const validFormats = { ...METADATA_FORMATS, ...TREE_FORMATS };

function LocalUpload() {
  const dispatch = useAppDispatch();
  const [submission, setSubmission] = useState({
    status: LoadingState.IDLE,
    messages: [] as ResponseMessage[] | undefined,
  });
  const [options, setOptions] = useState({
    validate: false,
    blank: false,
  } as Options);
  const [files, setFiles] = useState<DropFileUpload[]>([]);
  const [fileValidated, setFileValidated] = useState(false);
  const [showFieldsTable, setShowFieldsTable] = useState(false);
  const [parsedMetadata, setParsedMetadata] = useState<Sample[]>([]);
  const [parsedFields, setParsedFields] = useState<DeducedField[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const scrollRef = useRef<null | HTMLDivElement>(null);

  const submitButton = () => {
    if (files.length > 0 && METADATA_FORMATS[getSuffix(files[0])]) {
      // Metadata file
      const metadataReady = fileValidated && parseError == null;
      return (
        <Button
          variant="contained"
          disabled={!metadataReady}
          endIcon={<FileUpload />}
          onClick={() => handleMetadataAdded(files[0].file)}
        >
          Add metadata
        </Button>
      );
    }
    if (files.length > 0 && TREE_FORMATS[getSuffix(files[0])]) {
      // Tree file
      const treeReady = fileValidated;
      return (
        <Button
          variant="contained"
          disabled={!treeReady}
          endIcon={<FileUpload />}
          onClick={() => handleTreeAdded(files[0].file)}
        >
          Add tree
        </Button>
      );
    }
    return (
      <Button variant="contained" disabled endIcon={<FileUpload />}>
        Add data
      </Button>
    );
  };

  useEffect(() => {
    // Scroll validation or upload response messages into view
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

  // When metadata file added, show and update fields table
  // When metadata file removed, hide fields table
  useEffect(() => {
    function parseCSV(file: File) {
      Papa.parse(file, {
        header: true,
        complete: (result: any) => {
          // TODO need to handle papaparse errors and set parseError

          const csvData = result.data as Sample[];
          const fieldNames: string[] = result.meta.fields;

          if (csvData.length === 0) {
            setParseError('File appears to contain no records');
            // TODO if we have succeeded, but result.errors is non-empty, show warnings
            return;
          }

          const fields: DeducedField[] = buildFieldListAndUpdateData(csvData, fieldNames);
          setParsedMetadata(csvData);
          setParsedFields(fields);
        },
      });
    }

    const metadataFileAvailable: boolean =
      files.length > 0 &&
      Object.keys(METADATA_FORMATS).includes(getSuffix(files[0])) &&
      fileValidated;
    if (metadataFileAvailable) {
      parseCSV(files[0].file);
    }
    setShowFieldsTable(metadataFileAvailable);
  }, [files, fileValidated]);

  const handleMetadataAdded = async (file: File) => {
    // Needs to validate, and insert data into project redux state
    dispatch(addMetadata({ uploadedData: parsedMetadata, uploadedFields: parsedFields }));

    // TODO is there a failure case here? handle ingestion errors resulting from e.g. wrong field types
    setSubmission((oldSubmissionState) => ({
      ...oldSubmissionState,
      status: LoadingState.SUCCESS, // TODO how to actually ensure success? check project state?
      messages: [
        {
          ResponseType: ResponseType.Success,
          ResponseMessage: 'Data loaded',
        },
      ],
    }));
    setFiles([]);
  };

  const handleTreeAdded = async (file: File) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = (event) => {
      const newickString = event.target?.result as string;
      dispatch(
        addTree({
          treeName: 'Loaded tree', // TODO ask user for tree name
          newickTree: newickString,
        }),
      );
      setSubmission((oldSubmissionState) => ({
        ...oldSubmissionState,
        status: LoadingState.SUCCESS, // TODO how to actually ensure success? check tree state?
        messages: [
          {
            ResponseType: ResponseType.Success,
            ResponseMessage: 'Tree loaded',
          },
        ],
      }));
    };
    setFiles([]);
  };

  return (
    <>
      <Typography variant="h2" paddingBottom={1} color="primary">
        Add Data
      </Typography>
      <Grid
        container
        spacing={2}
        sx={{ paddingBottom: 4 }}
        justifyContent="space-between"
        alignItems="center"
      >
        <Grid size={{ md: 12, lg: 9 }}>
          <Typography variant="subtitle2" paddingBottom={1}>
            Drag-and-drop a sample metadata file or tree file to add it to your project.
            <br />
            Metadata can be added in tabular (CSV) format. The Seq_ID column will be used as the
            unique identifier to match to tree nodes.
            <br />
            Trees can be added in newick format.
          </Typography>
        </Grid>
      </Grid>
      <Grid container spacing={6} alignItems="stretch" sx={{ paddingBottom: 6 }}>
        <Grid size={{ md: 6, xs: 12 }}>
          <Grid size={12}>
            <Typography variant="h4" color="primary">
              Select metadata or tree file
            </Typography>
            <FileDragDrop
              files={files}
              setFiles={setFiles}
              validFormats={validFormats}
              validated={fileValidated}
              setValidated={setFileValidated}
              multiple={false}
            />
          </Grid>
          <Grid container size={12} justifyContent="flex-end">
            {submitButton()}
          </Grid>
        </Grid>
        <Grid size={{ md: 6, xs: 12 }}>
          {showFieldsTable && (
            <FieldUploadCheck fields={parsedFields} setFields={setParsedFields} csvData={parsedMetadata} />
          )}
        </Grid>
      </Grid>

      <div ref={scrollRef}>
        {submission.status === LoadingState.SUCCESS || submission.status === LoadingState.ERROR ? (
          <Validation
            messages={submission.messages ?? []}
            title={options.validate ? 'Validation status' : 'Upload status'}
            showTitle
          />
        ) : null}
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
            <Typography>
              {options.validate ? 'Validating metadata... ' : 'Adding metadata... '}
            </Typography>
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
