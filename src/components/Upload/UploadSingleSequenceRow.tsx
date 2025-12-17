import {
  Chip,
  CircularProgress,
  FormControl,
  TableCell,
  TextField, Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import {
  SeqSingleUploadRow,
  SeqUploadRowState,
  SkipForce,
} from '../../types/sequploadtypes';
import LoadingState from '../../constants/loadingState';
import { ResponseMessage } from '../../types/apiResponse.interface';
import { useApi } from '../../app/ApiContext';
import { createSample, shareSamples, uploadFastqSequence } from '../../utilities/resourceUtils';
import { ResponseType } from '../../constants/responseType';
import { ValidationPopupButton } from '../Validation/Validation';
import { generateHash } from '../../utilities/file';
import { tableCellStyle, tableFormControlStyle, seqStateStyles } from '../../styles/uploadPageStyles';
import { ResponseObject } from '../../types/responseObject.interface';

interface UploadSequenceRowProps {
  seqUploadRow: SeqSingleUploadRow,
  updateRow: (newSur: SeqSingleUploadRow) => void,
  modeOption: SkipForce,
  owner: string | null,
  sharedProjects: string[],
}

export default function UploadSingleSequenceRow(props: UploadSequenceRowProps) {
  const { seqUploadRow } = props;
  const { updateRow } = props;
  const { modeOption } = props;
  const { owner } = props;
  const { sharedProjects } = props;

  const [seqSubmission, setSeqSubmission] = useState({
    status: LoadingState.IDLE,
    messages: [] as ResponseMessage[],
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

  const handleSampleCreate = async () => {
    if (owner == null) {
      setSeqSubmission({
        ...seqSubmission,
        messages: [
          ...seqSubmission.messages,
          { ResponseMessage: 'Owner is null', ResponseType: ResponseType.Error } as ResponseMessage,
        ],
      });
      return;
    }
    const messages = [] as ResponseMessage[];
    const sampleResp = await createSample(
      token,
      seqUploadRow.seqId,
      owner,
      sharedProjects,
      seqUploadRow.clientSessionId,
    );
    if (sampleResp.httpStatusCode === 409) {
      // If it's a conflict, display this as a warning.
      const message = sampleResp.messages[0];
      message.ResponseType = ResponseType.Warning;
      messages.push(message);
    } else {
      messages.push(...sampleResp.messages);
    }
    const sampleSharePromises = [] as Promise<ResponseObject<any>>[];

    sharedProjects.forEach(r =>
      sampleSharePromises.push(shareSamples(token, `${r}-Group`, [seqUploadRow.seqId], seqUploadRow.clientSessionId)));

    for (const resp of (await Promise.all(sampleSharePromises))) {
      messages.push(...resp.messages);
    }
    setSeqSubmission({
      ...seqSubmission,
      messages: [...seqSubmission.messages, ...messages],
    });
    updateState(SeqUploadRowState.CalculatingHash);
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
      'X-Client-Session-ID': seqUploadRow.clientSessionId,
    };

    const sequenceResponse = await uploadFastqSequence(formData, optionString, token, headers);
    if (sequenceResponse.status === ResponseType.Success) {
      setSeqSubmission({
        ...seqSubmission,
        status: LoadingState.SUCCESS,
        messages: [...seqSubmission.messages, ...sequenceResponse.messages],
      });
      if (seqSubmission.messages.some(m => m.ResponseType === ResponseType.Error)) {
        // If any other api requests returned errors, users need to know
        updateState(SeqUploadRowState.Incomplete);
      } else {
        updateState(SeqUploadRowState.Complete);
      }
    } else {
      setSeqSubmission({
        ...seqSubmission,
        status: LoadingState.ERROR,
        messages: [...seqSubmission.messages, ...sequenceResponse.messages],
      });
      updateState(SeqUploadRowState.Errored);
    }
  };

  const disableResponse = (): boolean =>
    seqUploadRow.state !== SeqUploadRowState.Complete
    && seqUploadRow.state !== SeqUploadRowState.Errored
    && seqUploadRow.state !== SeqUploadRowState.Incomplete;

  const requestCompleted = (): boolean | undefined =>
    seqUploadRow.state === SeqUploadRowState.Complete;

  const requestWaiting = (): boolean => seqUploadRow.state === SeqUploadRowState.Waiting;

  const rowInProgress = (): boolean => ![
    SeqUploadRowState.Waiting,
    SeqUploadRowState.Complete,
    SeqUploadRowState.Errored,
    SeqUploadRowState.Incomplete,
  ].includes(seqUploadRow.state);

  useEffect(() => {
    if (seqUploadRow.state === SeqUploadRowState.CreateSample) {
      handleSampleCreate();
    }
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
              <ValidationPopupButton
                messages={seqSubmission.messages ?? []}
                title="Response Messages"
                disabled={disableResponse()}

              />
            ))}
        </>
      </TableCell>
    </>
  );
}
