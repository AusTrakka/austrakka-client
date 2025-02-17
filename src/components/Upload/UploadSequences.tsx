import React, {Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, Typography,} from '@mui/material';
import {useEffect, useState} from 'react';
import {getEnumByValue} from '../../utilities/enumUtils';
import {DropFileUpload} from '../../types/DropFileUpload';
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
      .map(f => ({file: f, sampleName: getSampleNameFromFile(f.name)} as SeqPair));
    // @ts-ignore
    const groupedFilenames = filenames
      .reduce((ubc, u) => ({...ubc, [u.sampleName]: [...(ubc[u.sampleName] || []), u]}), {});
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

  const getRowsOfState = (state: SeqUploadRowState) => {
    return seqUploadRows.filter(sur => sur.state === state);
  }
  
  const uploadInProgress = (): boolean => {
    return !seqUploadRows.every(sur => 
      sur.state === SeqUploadRowState.Complete || 
      sur.state === SeqUploadRowState.Errored ||
      sur.state === SeqUploadRowState.Waiting
    )
  }
  
  const uploadFinished = (): boolean => {
    return seqUploadRows.every(sur =>
      sur.state === SeqUploadRowState.Complete ||
      sur.state === SeqUploadRowState.Errored
    )
  }

  useEffect(() => {
    const calculated = getRowsOfState(SeqUploadRowState.CalculatedHash);
    const calculating = getRowsOfState(SeqUploadRowState.CalculatingHash);
    const queued = getRowsOfState(SeqUploadRowState.Queued);
    const processing = getRowsOfState(SeqUploadRowState.Uploading);

    for (const row of queued.slice(0, Math.abs(calculating.length - 2))) {
      // Calculate 2 hashes at a time
      updateRow({...row, state: SeqUploadRowState.CalculatingHash});
    }
    for (const row of calculated.slice(0, Math.abs(processing.length - 1))) {
      // Only upload 1 at a time
      updateRow({...row, state: SeqUploadRowState.Uploading});
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
  const [selectedSkipForce, setSelectedSkipForce] = useState<SkipForce>(SkipForce.Skip);
  const handleSelectSkipForce = (skipForceStr: string) => {
    const skipForce = getEnumByValue(SkipForce, skipForceStr) as SkipForce;
    setSelectedSkipForce(skipForce);
  };

  const handleClearFiles = () => {
    setFiles([])
  }

  const handleUpload = () => {
    queueAllRows();
  };

  return (
    <Box>
      <Typography variant="h2" paddingBottom={1} color="primary">Upload Sequences</Typography>
      <Typography variant="subtitle1" paddingBottom={1}>Only FASTQ uploads are handled via the portal currently. Please
        use the CLI for any FASTA uploads.</Typography>
      <FormControl
        size="small"
        sx={{minWidth: 200, marginTop: 2, marginBottom: 2}}
        variant="standard"
      >
        <InputLabel id="fastq-simple-select-label">FASTQ Type</InputLabel>
        <Select
          labelId="fastq-simple-select-label"
          id="fastq-simple-select-label"
          label="Fastq"
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
      <FormControl
        size="small"
        sx={{minWidth: 200, marginTop: 2, marginBottom: 2}}
        variant="standard"
      >
        <InputLabel id="skip-force-simple-select-label">Skip / Force</InputLabel>
        <Select
          labelId="skip-force-simple-select-label"
          id="skip-force-simple-select-label"
          label="Skip / Force"
          name="skip-force"
          value={selectedSkipForce}
          onChange={(e) => handleSelectSkipForce(e.target.value)}
        >
          {Object.values(SkipForce).map((skipForce: SkipForce) => (
            <MenuItem
              value={skipForce}
              key={skipForce}
            >
              {`${skipForce}`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
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
          hideAfterDrop={true}
        />
        {seqUploadRows.map(sur => (
          <UploadSequenceRow
            key={sur.id}
            seqUploadRow={sur}
            updateRow={updateRow}
            modeOption={selectedSkipForce}
            seqTypeOption={selectedSeqType}
          />
        ))}
      {files.length === 0 ? (
        <></>
      ) : (
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
      )}
    </Box>
  );
}

export default UploadSequences;
