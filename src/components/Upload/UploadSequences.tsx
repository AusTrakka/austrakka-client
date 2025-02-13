import React, {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Button,
  TextField
} from '@mui/material';
import { useEffect, useState } from 'react';
import LoadingState from '../../constants/loadingState';
import {getEnumByValue} from '../../utilities/enumUtils';
import FileDragDrop2 from "./FileDragDrop2";
import {DropFileUpload} from "../../types/DropFileUpload";
import {ResponseObject} from "../../types/responseObject.interface";
import {uploadFastqSequence} from "../../utilities/resourceUtils";
import {ResponseType} from "../../constants/responseType";
import {ResponseMessage} from "../../types/apiResponse.interface";
import {useApi} from "../../app/ApiContext";
import {validateEvenNumberOfFiles} from "../../utilities/uploadUtils";

interface SeqUploadRow {
  seqId: string | undefined
  read1: DropFileUpload | undefined
  read2: DropFileUpload | undefined
}

enum SeqType {
    FastqIllPe = 'fastq-ill-pe',
    FastqIllSe = 'fastq-ill-se',
    FastqOnt = 'fastq-ont',
}

enum SkipForce {
    Skip = 'skip',
    Force = 'overwrite',
}

const validFormats = {
  ".fq": "",
  ".fastq": "",
  ".fq.gz": "",
  ".fastq.gz": "",
}

function UploadSequences() {
  useEffect(() => {
  }, []);
  const [files, setFiles] = useState<DropFileUpload[]>([]);
  const [seqUploadRow, setSeqUploadRow] = useState<SeqUploadRow>();
  
  const handleSeqId = (seqId: string) => {
    setSeqUploadRow({
      seqId: seqId,
      read1: seqUploadRow?.read1,
      read2: seqUploadRow?.read2,
    })
  }
  
  const handleSelectRead1 = (read1File: string) => {
    const file = files.filter(f => f.file.name == read1File)[0];
    setSeqUploadRow({
      seqId: seqUploadRow?.seqId,
      read1: file,
      read2: seqUploadRow?.read2,
    })
  };
  const handleSelectRead2 = (read2File: string) => {
    const file = files.filter(f => f.file.name == read2File)[0];
    setSeqUploadRow({
      seqId: seqUploadRow?.seqId,
      read1: seqUploadRow?.read1,
      read2: file,
    })
  };

  useEffect(() => {
    // TODO: this needs to calculate these
    setSeqUploadRow({
      seqId: seqUploadRow?.seqId,
      read1: files[0],
      read2: files[1],
    })
  }, [files]);
  
  const [seqSubmission, setSeqSubmission] = useState({
    status: LoadingState.IDLE,
    messages: [] as ResponseMessage[] | undefined,
  });
  const { token, tokenLoading } = useApi();


  const [sequenceTypes, setSequenceTypes] = useState<SeqType[]>([
    SeqType.FastqIllPe,
    SeqType.FastqIllSe,
    SeqType.FastqOnt,
  ])
  const [selectedSeqType, setSelectedSeqType] = useState<SeqType>(SeqType.FastqIllPe);
  const handleSelectSeqType = (seqTypeStr: string) => {
    const seqType = getEnumByValue(SeqType, seqTypeStr) as SeqType
    setSelectedSeqType(seqType);
  };
  const [skipForceValues, setSkipForceValues] = useState<SkipForce[]>([
    SkipForce.Skip,
    SkipForce.Force,
  ])
  const [selectedSkipForce, setSelectedSkipForce] = useState<SkipForce>(SkipForce.Skip);
  const handleSelectSkipForce = (skipForceStr: string) => {
    const skipForce = getEnumByValue(SkipForce, skipForceStr) as SkipForce
    setSelectedSkipForce(skipForce);
  };
  
  const handleSubmit = async () => {
    if (!seqUploadRow) {
      return
    }
    if (!seqUploadRow.read1 || !seqUploadRow.read2) {
      // TODO: need an error message here
      return
    }
    console.log("submitting")
    setSeqSubmission({
      ...seqSubmission,
      status: LoadingState.LOADING,
    });
    const optionString = ``;
    const formData = new FormData();
    formData.append('file', seqUploadRow.read1.file);
    formData.append('file', seqUploadRow.read2.file);
    
    const headers = {
      'mode': selectedSkipForce,
      'seq-type': selectedSeqType,
      'seq-id': seqUploadRow.seqId,
      'filename1': seqUploadRow.read1.file.name,
      'filename1-hash': seqUploadRow.read1.hash,
      'filename2': seqUploadRow.read2.file.name,
      'filename2-hash': seqUploadRow.read2.hash,
    }

    const sequenceResponse: ResponseObject = await uploadFastqSequence(formData, optionString, token, headers);

    if (sequenceResponse.status === ResponseType.Success) {
      setSeqSubmission({
        ...seqSubmission,
        status: LoadingState.SUCCESS,
        messages: sequenceResponse.messages,
      });
    } else {
      setSeqSubmission({
        ...seqSubmission,
        status: LoadingState.ERROR,
        messages: sequenceResponse.messages,
      });
    }
  };

  return (
    <Box>
      <Typography variant="h2" paddingBottom={1} color="primary">Upload Sequences</Typography>
      <Typography variant="subtitle1" paddingBottom={1}>Only FASTQ uploads are handled via the portal currently. Please use the CLI for any FASTA uploads.</Typography>
      <FormControl
        size="small"
        sx={{ minWidth: 200, marginTop: 2, marginBottom: 2 }}
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
          { sequenceTypes.map((seqType: SeqType) => (
            <MenuItem
              value={seqType}
              key={seqType}
            >
              {`${seqType}`}
            </MenuItem>
          )) }
        </Select>
      </FormControl>
      <FormControl
        size="small"
        sx={{ minWidth: 200, marginTop: 2, marginBottom: 2 }}
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
          { skipForceValues.map((skipForce: SkipForce) => (
            <MenuItem
              value={skipForce}
              key={skipForce}
            >
              {`${skipForce}`}
            </MenuItem>
          )) }
        </Select>
      </FormControl>
      <Typography variant="h4" color="primary">Select sequence files</Typography>
      <Stack direction="row" spacing={2}>
        <FileDragDrop2 
          files={files} 
          setFiles={setFiles} 
          validFormats={validFormats} 
          multiple={true} 
          calculateHash={true}
          customValidators={[validateEvenNumberOfFiles]}
        />
        {files.length === 0 ? (<></>) : (
          <>
            <FormControl
              size="small"
              sx={{ minWidth: 200, marginTop: 2, marginBottom: 2 }}
              variant="standard"
            >
              <TextField
                label="Seq ID"
                id="seqid-simple-select-label"
                name="seqid"
                variant="standard"
                value={seqUploadRow?.seqId ?? ""}
                onChange={e => handleSeqId(e.target.value)}
              />
            </FormControl>
            <FormControl
              size="small"
              sx={{ minWidth: 200, marginTop: 2, marginBottom: 2 }}
              variant="standard"
            >
              <InputLabel id="read1-simple-select-label">Read 1</InputLabel>
              <Select
                labelId="read1-simple-select-label"
                id="read1-simple-select-label"
                label="Read 1"
                name="read1"
                value={seqUploadRow?.read1?.file.name ?? ""}
                onChange={(e) => handleSelectRead1(e.target.value)}
              >
                { files.map((file: DropFileUpload) => (
                  <MenuItem
                    value={file.file.name}
                    key={file.file.name}
                  >
                    {`${file.file.name}`}
                  </MenuItem>
                )) }
              </Select>
            </FormControl>
            <FormControl
              size="small"
              sx={{ minWidth: 200, marginTop: 2, marginBottom: 2 }}
              variant="standard"
            >
              <InputLabel id="read2-simple-select-label">Read 2</InputLabel>
              <Select
                labelId="read2-simple-select-label"
                id="read2-simple-select-label"
                label="Read 2"
                name="read2"
                value={seqUploadRow?.read2?.file.name ?? ""}
                onChange={(e) => handleSelectRead2(e.target.value)}
              >
                { files.map((file: DropFileUpload) => (
                  <MenuItem
                    value={file.file.name}
                    key={file.file.name}
                  >
                    {`${file.file.name}`}
                  </MenuItem>
                )) }
              </Select>
            </FormControl>
          </>
          )}
      </Stack>
      <Button onClick={handleSubmit}>Upload</Button>
    </Box>
  );
}
export default UploadSequences;
