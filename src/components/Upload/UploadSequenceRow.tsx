import {
  Button,
  Chip,
  CircularProgress,
  FormControl,
  MenuItem,
  Select,
  TableCell,
  TextField,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { seqStateStyles, SeqType, SeqUploadRow, SeqUploadRowState, SkipForce } from '../../utilities/uploadUtils';
import LoadingState from '../../constants/loadingState';
import { ResponseMessage } from '../../types/apiResponse.interface';
import { useApi } from '../../app/ApiContext';
import { uploadFastqSequence } from '../../utilities/resourceUtils';
import { ResponseType } from '../../constants/responseType';
import ValidationModal from '../Validation/ValidationModal';
import { generateHash } from '../../utilities/file';

interface UploadSequenceRowProps {
  seqUploadRow: SeqUploadRow,
  updateRow: (newSur: SeqUploadRow) => void,
  modeOption: SkipForce,
  seqTypeOption: SeqType,
}

const tableCellStyle = { padding: '0px', paddingLeft: '4px', paddingRight: '4px' };
const tableFormControlStyle = { minWidth: 200, marginTop: 1, marginBottom: 1 };

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
    updateRow({
      ...seqUploadRow,
      read1: {
        ...seqUploadRow.read1,
        hash: await generateHash(await seqUploadRow.read1.file.arrayBuffer()),
      },
      read2: {
        ...seqUploadRow.read2,
        hash: await generateHash(await seqUploadRow.read2.file.arrayBuffer()),
      },
    });
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
    
    // sleep 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));
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

  const disableResponse = (): boolean | undefined =>
    seqUploadRow.state !== SeqUploadRowState.Complete
      && seqUploadRow.state !== SeqUploadRowState.Errored;

  const requestCompleted = (): boolean | undefined =>
    seqUploadRow.state === SeqUploadRowState.Complete;

  const requestWaiting = (): boolean => seqUploadRow.state === SeqUploadRowState.Waiting;

  const rowInProgress = (): boolean => ![
    SeqUploadRowState.Waiting,
    SeqUploadRowState.Complete,
    SeqUploadRowState.Errored,
  ].includes(seqUploadRow.state);

  useEffect(() => {
    console.log(`Updating state for ${seqUploadRow.seqId} to ${seqUploadRow.state}`);
    if (seqUploadRow.state === SeqUploadRowState.CalculatingHash) {
      calculateHash()
        .catch(console.error);
    }
    if (seqUploadRow.state === SeqUploadRowState.Uploading) {
      handleSubmit()
        .catch(console.error);
    }
  }, [seqUploadRow.state]);

  useEffect(() => {
    if (seqUploadRow.read1.hash !== undefined && seqUploadRow.read2.hash !== undefined) {
      updateState(SeqUploadRowState.CalculatedHash);
    }
  }, [seqUploadRow.read1.hash, seqUploadRow.read2.hash]);

  return (
    <>
      <TableCell sx={tableCellStyle}>
        <FormControl
          size="small"
          sx={tableFormControlStyle}
          variant="standard"
        >
          <TextField
            id={`read1-select-${seqUploadRow.id}`}
            name="seqid"
            variant="standard"
            slotProps={{ input: { disableUnderline: requestCompleted() } }}
            value={seqUploadRow?.seqId ?? ''}
            onChange={e => handleSeqId(e.target.value)}
            disabled={requestCompleted()}
          />
        </FormControl>
      </TableCell>
      <TableCell sx={tableCellStyle}>
        <FormControl
          size="small"
          sx={tableFormControlStyle}
          variant="standard"
        >
          <Select
            id={`read1-select-${seqUploadRow.id}`}
            name="read1"
            disableUnderline
            value={seqUploadRow?.read1?.file.name ?? ''}
            onChange={(e) => handleSelectRead1(e.target.value)}
            disabled={requestCompleted()}
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
      </TableCell>
      <TableCell sx={tableCellStyle}>
        <FormControl
          size="small"
          sx={tableFormControlStyle}
          variant="standard"
        >
          <Select
            id={`read2-select-${seqUploadRow.id}`}
            name="read2"
            disableUnderline
            value={seqUploadRow?.read2?.file.name ?? ''}
            onChange={(e) => handleSelectRead2(e.target.value)}
            disabled={requestCompleted()}
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
      </TableCell>
      <TableCell sx={tableCellStyle}>
        {/* Would JoyUI LinearProgress be an option here? */}
        <Chip
          label={seqUploadRow.state}
          variant="filled"
          sx={{ borderRadius: 1, width: '10em', ...seqStateStyles[seqUploadRow.state] }}
        />
      </TableCell>
      <TableCell sx={tableCellStyle}>
        {rowInProgress() ? (
          <CircularProgress size={20} />
        ) : (
          requestWaiting() || (
          <Button
            size="small"
            variant="outlined"
            color="primary"
            onClick={() => {
              setShowValidation(!showValidation);
            }}
            disabled={disableResponse()}
          >
            Show Response
          </Button>
          ))}
      </TableCell>
      <ValidationModal
        messages={seqSubmission.messages ?? []}
        title="Response Messages"
        openModal={showValidation}
        handleModalClose={() => setShowValidation(!showValidation)}
      />
    </>
  );
}
