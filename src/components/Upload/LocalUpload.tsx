import { FileUpload } from '@mui/icons-material';
import {
  Alert,
  Backdrop,
  Button,
  CircularProgress,
  OutlinedInput,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import Papa from 'papaparse';
import { useEffect, useRef, useState } from 'react';
import { addMetadata, selectMetadataFilename } from '../../app/projectMetadataSlice';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { addTree, selectNextTreeIndex } from '../../app/treeSlice';
import LoadingState from '../../constants/loadingState';
import { ResponseType } from '../../constants/responseType';
import { LOCAL_PROJECT } from '../../constants/standaloneClientConstants';
import type { ResponseMessage } from '../../types/apiResponse.interface';
import type { DropFileUpload } from '../../types/DropFileUpload';
import type { DeducedField } from '../../types/dtos';
import type { Sample } from '../../types/sample.interface';
import { buildFieldListAndUpdateData } from '../../utilities/standaloneClientUtils';
import { Validation } from '../Validation/Validation';
import FieldUploadCheck from './FieldUploadCheck';
import FileDragDrop from './FileDragDrop';

// TODO add option to use local storage

const getSuffix = (file: DropFileUpload) => `.${file.file.name.split('.').pop() ?? ''}`;

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
  const [files, setFiles] = useState<DropFileUpload[]>([]);
  const [showFieldsTable, setShowFieldsTable] = useState(false);
  const [parsedMetadata, setParsedMetadata] = useState<Sample[]>([]);
  const [parsedFields, setParsedFields] = useState<DeducedField[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [newTreeName, setNewTreeName] = useState<string | null>(null);
  const scrollRef = useRef<null | HTMLDivElement>(null);

  const nextTreeIndex = useAppSelector((state) => selectNextTreeIndex(state));

  // TODO is there a better syntax for contains?
  const metadataFilePending =
    files.length > 0 && METADATA_FORMATS[getSuffix(files[0])] !== undefined;
  const treeFilePending = files.length > 0 && TREE_FORMATS[getSuffix(files[0])] !== undefined;

  const submitButton = () => {
    if (metadataFilePending) {
      // Metadata file
      // TODO this ought to depend on parsed metadata ready, not input file. Technically a race condition
      const metadataReady = files.length > 0 && parseError == null;
      return (
        <Button
          variant="contained"
          disabled={!metadataReady}
          endIcon={<FileUpload />}
          onClick={() => handleMetadataAdded()}
        >
          Add metadata
        </Button>
      );
    }
    if (treeFilePending) {
      return (
        <Button
          variant="contained"
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

  // When metadata file added, show and update fields table
  // When metadata file removed, hide fields table
  // When tree file added, set the default tree name ( TODO and parse the tree for correctness )
  useEffect(() => {
    function parseCSV(file: File) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result: any) => {
          // TODO need to handle papaparse errors and set parseError
          // TODO probably also trim data values

          const csvData = result.data as Sample[];
          const fieldNames: string[] = result.meta.fields;

          if (result.meta.fields.length === 0) {
            setParseError('Unable to parse CSV header');
            setParsedMetadata([]);
            setParsedFields([]);
            return;
          }

          if (csvData.length === 0) {
            setParseError('File appears to contain no records');
            setParsedMetadata([]);
            // We do have fields in this case but haven't attempted to deduce types, and there
            // is no point in listing fields if there's no data
            setParsedFields([]);
            return;
          }

          // TODO if we have succeeded, but result.errors is non-empty, show warnings

          const fields: DeducedField[] = buildFieldListAndUpdateData(csvData, fieldNames);
          setParseError(null);
          setParsedMetadata(csvData);
          setParsedFields(fields);
        },
      });
    }
    if (metadataFilePending) {
      parseCSV(files[0].file);
    } else {
      setParseError(null);
    }
    // TODO may want to hide when there is parseError
    //   and if not, don't need this variable at all, just base fields table on metadataFilePending
    setShowFieldsTable(metadataFilePending);

    // Reset tree name only when tree file added; user may then edit it
    if (treeFilePending) {
      setNewTreeName(`Tree ${nextTreeIndex}`);
    }
  }, [files, metadataFilePending, treeFilePending, nextTreeIndex]);

  const handleMetadataAdded = async () => {
    // Needs to validate, and insert data into project redux state
    dispatch(
      addMetadata({
        uploadedData: parsedMetadata,
        uploadedFields: parsedFields,
        filename: files[0].file.name,
      }),
    );

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
          name: newTreeName,
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
      <Grid container spacing={1} alignItems="flex-start" sx={{ paddingBottom: 6 }}>
        <Grid size={12}>
          <Typography variant="h4" color="primary">
            Select metadata or tree file
          </Typography>
        </Grid>
        <Grid container size={{ md: 6, xs: 12 }}>
          <Grid size={12}>
            <FileDragDrop
              files={files}
              setFiles={setFiles}
              validFormats={validFormats}
              multiple={false}
            />
          </Grid>
          <Grid container size={12} justifyContent="flex-end" sx={{ paddingBottom: 2 }}>
            {submitButton()}
          </Grid>
        </Grid>
        <Grid container spacing={1} size={{ md: 6, xs: 12 }}>
          {parseError && (
            <Grid size={12}>
              <Alert severity="error">
                <Typography>{parseError}</Typography>
              </Alert>
            </Grid>
          )}
          {showFieldsTable && (
            <Grid size={12}>
              <FieldUploadCheck
                fields={parsedFields}
                setFields={setParsedFields}
                csvData={parsedMetadata}
              />
            </Grid>
          )}
          {treeFilePending && (
            <Grid size={12} container alignItems="center" spacing={1}>
              <Grid>
                <Typography>Tree name:</Typography>
              </Grid>
              <Grid>
                <OutlinedInput
                  value={newTreeName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewTreeName(e.target.value)
                  }
                  size="small"
                  sx={{ width: 250 }}
                />
              </Grid>
            </Grid>
          )}
        </Grid>
      </Grid>

      <div ref={scrollRef}>
        {submission.status === LoadingState.SUCCESS || submission.status === LoadingState.ERROR ? (
          <Validation messages={submission.messages ?? []} title={'Upload status'} showTitle />
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
            <Typography>{'Adding metadata... '}</Typography>
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
