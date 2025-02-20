import {
  Button,
  Chip,
  CircularProgress,
  FormControl,
  TableCell,
  TextField, Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import {
  seqStateStyles,
  SeqSingleUploadRow,
  SeqUploadRowState,
  SkipForce,
} from '../../utilities/uploadUtils';
import LoadingState from '../../constants/loadingState';
import { ResponseMessage } from '../../types/apiResponse.interface';
import { useApi } from '../../app/ApiContext';
import { uploadFastqSequence } from '../../utilities/resourceUtils';
import { ResponseType } from '../../constants/responseType';
import ValidationModal from '../Validation/ValidationModal';
import { generateHash } from '../../utilities/file';
import { tableCellStyle, tableFormControlStyle } from '../../styles/uploadPageStyles';

interface UploadSequenceRowProps {
  seqUploadRow: SeqSingleUploadRow,
  updateRow: (newSur: SeqSingleUploadRow) => void,
  modeOption: SkipForce,
}

export default function UploadSingleSequenceRow(props: UploadSequenceRowProps) {
  const { seqUploadRow } = props;
  const { updateRow } = props;
  const { modeOption } = props;
  
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
    } as SeqSingleUploadRow);
  };

  const calculateHash = async () => {
    updateRow({
      ...seqUploadRow,
      file: {
        ...seqUploadRow.file,
        hash: await generateHash(await seqUploadRow.file.file.arrayBuffer()),
      },
    });
  };

  const handleSeqId = (seqId: string) => {
    updateRow({
      ...seqUploadRow,
      seqId,
    } as SeqSingleUploadRow);
  };

  const handleSubmit = async () => {
    setSeqSubmission({
      ...seqSubmission,
      status: LoadingState.LOADING,
    });
    const optionString = '';
    const formData = new FormData();
    formData.append('file', seqUploadRow.file.file);

    const headers = {
      'mode': modeOption,
      'seq-type': seqUploadRow.seqType,
      'seq-id': seqUploadRow.seqId,
      'filename': seqUploadRow.file.file.name,
      'filename-hash': seqUploadRow.file.hash,
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
    if (seqUploadRow.state === SeqUploadRowState.CalculatingHash) {
      calculateHash();
    }
    if (seqUploadRow.state === SeqUploadRowState.Uploading) {
      handleSubmit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seqUploadRow.state]);

  useEffect(() => {
    if (seqUploadRow.file.hash !== undefined) {
      updateState(SeqUploadRowState.CalculatedHash);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seqUploadRow.file.hash]);

  return (
    <>
      <TableCell sx={tableCellStyle}>
        <FormControl
          size="small"
          sx={tableFormControlStyle}
          variant="standard"
        >
          <TextField
            id={`seqid-select-${seqUploadRow.id}`}
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
        <Typography>
          {seqUploadRow?.file?.file.name ?? ''}
        </Typography>
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
        <>
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
        </>
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
