import React, {Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography} from "@mui/material";
import {SeqType, SeqUploadRow, SeqUploadRowStatus, SkipForce} from "./UploadSequences";
import {useState} from "react";
import LoadingState from "../../constants/loadingState";
import {ResponseMessage} from "../../types/apiResponse.interface";
import {useApi} from "../../app/ApiContext";
import {uploadFastqSequence} from "../../utilities/resourceUtils";
import {ResponseObject} from "../../types/responseObject.interface";
import {ResponseType} from "../../constants/responseType";
import {generateHash} from "../../utilities/file";

interface UploadSequenceRowProps {
  seqUploadRow: SeqUploadRow,
  updateRow: (newSur: SeqUploadRow) => void,
  modeOption: SkipForce,
  seqTypeOption: SeqType,
}

export default function UploadSequenceRow(props: UploadSequenceRowProps) {
  const seqUploadRow = props.seqUploadRow;
  const updateRow = props.updateRow;
  const modeOption = props.modeOption;
  const seqTypeOption = props.seqTypeOption;
  
  const [seqSubmission, setSeqSubmission] = useState({
    status: LoadingState.IDLE,
    messages: [] as ResponseMessage[] | undefined,
  });
  const { token, tokenLoading } = useApi();

  const handleSeqId = (seqId: string) => {
    updateRow({
      id: seqUploadRow.id,
      seqId: seqId,
      read1: seqUploadRow.read1,
      read2: seqUploadRow.read2,
      status: seqUploadRow.status,
    } as SeqUploadRow)
  }

  const handleSelectRead1 = (read1File: string) => {
    if (read1File == seqUploadRow.read1.file.name) {
      return
    } 
    updateRow({
      id: seqUploadRow.id,
      seqId: seqUploadRow.seqId,
      read1: seqUploadRow.read2,
      read2: seqUploadRow.read1,
      status: seqUploadRow.status,
    } as SeqUploadRow)
  };
  const handleSelectRead2 = (read2File: string) => {
    if (read2File == seqUploadRow.read2.file.name) {
      return
    } 
    updateRow({
      id: seqUploadRow.id,
      seqId: seqUploadRow.seqId,
      read1: seqUploadRow.read2,
      read2: seqUploadRow.read1,
      status: seqUploadRow.status,
    } as SeqUploadRow)
  };
  
  const updateStatus = (status: SeqUploadRowStatus) => {
    updateRow({
      id: seqUploadRow.id,
      seqId: seqUploadRow.seqId,
      read1: seqUploadRow.read1,
      read2: seqUploadRow.read2,
      status: status
    } as SeqUploadRow)
  }
  
  const handleSubmit = async () => {
    updateStatus(SeqUploadRowStatus.CalculatingHash)
    await new Promise(r => setTimeout(r, 2000));
    setSeqSubmission({
      ...seqSubmission,
      status: LoadingState.LOADING,
    });
    const optionString = ``;
    const formData = new FormData();
    formData.append('file', seqUploadRow.read1.file);
    formData.append('file', seqUploadRow.read2.file);

    const headers = {
      'mode': modeOption,
      'seq-type': seqTypeOption,
      'seq-id': seqUploadRow.seqId,
      'filename1': seqUploadRow.read1.file.name,
      'filename1-hash': await generateHash(await seqUploadRow.read1.file.text()),
      'filename2': seqUploadRow.read2.file.name,
      'filename2-hash': await generateHash(await seqUploadRow.read2.file.text()),
    }

    updateStatus(SeqUploadRowStatus.Processing)
    const sequenceResponse: ResponseObject = await uploadFastqSequence(formData, optionString, token, headers);
    if (sequenceResponse.status === ResponseType.Success) {
      setSeqSubmission({
        ...seqSubmission,
        status: LoadingState.SUCCESS,
        messages: sequenceResponse.messages,
      });
      updateStatus(SeqUploadRowStatus.Complete)
    } else {
      setSeqSubmission({
        ...seqSubmission,
        status: LoadingState.ERROR,
        messages: sequenceResponse.messages,
      });
      updateStatus(SeqUploadRowStatus.Errored)
    }
  };
  
  return (
    <>
        <>
          <Stack direction="row" spacing={2}>
            <FormControl
              size="small"
              sx={{minWidth: 200, marginTop: 2, marginBottom: 2}}
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
              sx={{minWidth: 200, marginTop: 2, marginBottom: 2}}
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
                <MenuItem
                  value={seqUploadRow?.read1?.file.name}
                  key={seqUploadRow?.read1?.file.name}
                >
                  {`${seqUploadRow?.read1?.file.name}`}
                </MenuItem>
                <MenuItem
                  value={seqUploadRow?.read2?.file.name}
                  key={seqUploadRow?.read2?.file.name}
                >
                  {`${seqUploadRow?.read2?.file.name}`}
                </MenuItem>
              </Select>
            </FormControl>
            <FormControl
              size="small"
              sx={{minWidth: 200, marginTop: 2, marginBottom: 2}}
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
                <MenuItem
                  value={seqUploadRow?.read1?.file.name}
                  key={seqUploadRow?.read1?.file.name}
                >
                  {`${seqUploadRow?.read1?.file.name}`}
                </MenuItem>
                <MenuItem
                  value={seqUploadRow?.read2?.file.name}
                  key={seqUploadRow?.read2?.file.name}
                >
                  {`${seqUploadRow?.read2?.file.name}`}
                </MenuItem>
              </Select>
            </FormControl>
            <Button onClick={handleSubmit}>Upload</Button>
            <Typography variant="subtitle1" >{seqUploadRow.status}</Typography>
          </Stack>
        </>
    </>
  )
}