import React, {Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography} from '@mui/material';
import { useEffect, useState } from 'react';
import { SeqType, SeqUploadRow, SeqUploadRowState, SkipForce } from '../../utilities/uploadUtils';
import LoadingState from '../../constants/loadingState';
import { ResponseMessage } from '../../types/apiResponse.interface';
import { useApi } from '../../app/ApiContext';
import { uploadFastqSequence } from '../../utilities/resourceUtils';
import { ResponseType } from '../../constants/responseType';
import { generateHash } from '../../utilities/file';
import ValidationModal from "../Validation/ValidationModal";

interface UploadSequenceRowProps {
  seqUploadRow: SeqUploadRow,
  updateRow: (newSur: SeqUploadRow) => void,
  modeOption: SkipForce,
  seqTypeOption: SeqType,
}

export default function UploadSequenceRow(props: UploadSequenceRowProps) {
  const { seqUploadRow } = props;
  const { updateRow } = props;
  const { modeOption } = props;
  const { seqTypeOption } = props;

  const [showValidation, setShowValidation] = useState(false);
  const [seqSubmission, setSeqSubmission] = useState({
    status: LoadingState.IDLE,
    messages: [] as ResponseMessage[] | undefined,
  });
  const { token } = useApi();

  const updateState = (state: SeqUploadRowState) => {
    updateRow({
      ...seqUploadRow,
      state,
    } as SeqUploadRow);
  };

  const calculateHash = async () => {
    console.log(`calculateHash ${seqUploadRow.seqId}`);

    if (seqUploadRow.read1.hash === undefined) {
      updateRow({
        ...seqUploadRow,
        read1: {
          ...seqUploadRow.read1,
          hash: await generateHash(await seqUploadRow.read1.file.text()),
        },
      });
    }
    if (seqUploadRow.read2.hash === undefined) {
      updateRow({
        ...seqUploadRow,
        read2: {
          ...seqUploadRow.read2,
          hash: await generateHash(await seqUploadRow.read2.file.text()),
        },
      });
    }
  };

  const handleSeqId = (seqId: string) => {
    updateRow({
      ...seqUploadRow,
      seqId,
    } as SeqUploadRow);
  };

  const handleSelectRead1 = (read1File: string) => {
    if (read1File === seqUploadRow.read1.file.name) {
      return;
    }
    updateRow({
      ...seqUploadRow,
      read1: seqUploadRow.read2,
      read2: seqUploadRow.read1,
    } as SeqUploadRow);
  };
  const handleSelectRead2 = (read2File: string) => {
    if (read2File === seqUploadRow.read2.file.name) {
      return;
    }
    updateRow({
      ...seqUploadRow,
      read1: seqUploadRow.read2,
      read2: seqUploadRow.read1,
    } as SeqUploadRow);
  };

  const handleSubmit = async () => {
    setSeqSubmission({
      ...seqSubmission,
      status: LoadingState.LOADING,
    });
    const optionString = '';
    const formData = new FormData();
    formData.append('file', seqUploadRow.read1.file);
    formData.append('file', seqUploadRow.read2.file);

    const headers = {
      'mode': modeOption,
      'seq-type': seqTypeOption,
      'seq-id': seqUploadRow.seqId,
      'filename1': seqUploadRow.read1.file.name,
      'filename1-hash': seqUploadRow.read1.hash,
      'filename2': seqUploadRow.read2.file.name,
      'filename2-hash': seqUploadRow.read2.hash,
    };

    const sequenceResponse = await uploadFastqSequence(formData, optionString, token, headers);
    if (sequenceResponse.status === ResponseType.Success) {
      setSeqSubmission({
        ...seqSubmission,
        status: LoadingState.SUCCESS,
        messages: sequenceResponse.messages,
      });
      updateState(SeqUploadRowState.Complete);
    } else {
      setSeqSubmission({
        ...seqSubmission,
        status: LoadingState.ERROR,
        messages: sequenceResponse.messages,
      });
      updateState(SeqUploadRowState.Errored);
    }
  };
  
  useEffect(() => {
    console.log(`Updating state for ${seqUploadRow.seqId} to ${seqUploadRow.state}`);
    if (seqUploadRow.state === SeqUploadRowState.CalculatingHash) {
      calculateHash()
        .then(() => updateState(SeqUploadRowState.CalculatedHash))
        .catch((err) => {
          console.error(err);
        });
    }
    if (seqUploadRow.state === SeqUploadRowState.Uploading) {
      handleSubmit()
        .then(() => {
        });
    }
  }, [seqUploadRow.state]);

  return (
    <>
    <Stack direction="row" spacing={2}>
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
          value={seqUploadRow?.seqId ?? ''}
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
          value={seqUploadRow?.read1?.file.name ?? ''}
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
        sx={{ minWidth: 200, marginTop: 2, marginBottom: 2 }}
        variant="standard"
      >
        <InputLabel id="read2-simple-select-label">Read 2</InputLabel>
        <Select
          labelId="read2-simple-select-label"
          id="read2-simple-select-label"
          label="Read 2"
          name="read2"
          value={seqUploadRow?.read2?.file.name ?? ''}
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
      <Button onClick={() => {setShowValidation(!showValidation)}}>Show Response</Button> 
      <Typography variant="subtitle1">{seqUploadRow.state}</Typography>
    </Stack>
    <ValidationModal 
      messages={seqSubmission.messages ?? []} 
      title={"Response Messages"} 
      openModal={showValidation}
      handleModalClose={() => setShowValidation(!showValidation)}
    />
    </>
  );
}
