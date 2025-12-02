import {
  Chip,
  CircularProgress,
  FormControl,
  MenuItem,
  Select,
  TableCell,
  TextField,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import {
  SeqPairedUploadRow,
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
  seqUploadRow: SeqPairedUploadRow,
  updateRow: (newSur: SeqPairedUploadRow) => void,
  modeOption: SkipForce,
  owner: string | null,
  sharedProjects: string[],
}

export default function UploadPairedSequenceRow(props: UploadSequenceRowProps) {
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
    } as SeqPairedUploadRow);
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
    } as SeqPairedUploadRow);
  };

  const handleSelectRead1 = (read1File: string) => {
    if (read1File === seqUploadRow.read1.file.name) {
      return;
    }
    updateRow({
      ...seqUploadRow,
      read1: seqUploadRow.read2,
      read2: seqUploadRow.read1,
    } as SeqPairedUploadRow);
  };
  const handleSelectRead2 = (read2File: string) => {
    if (read2File === seqUploadRow.read2.file.name) {
      return;
    }
    updateRow({
      ...seqUploadRow,
      read1: seqUploadRow.read2,
      read2: seqUploadRow.read1,
    } as SeqPairedUploadRow);
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
    const sampleResp = await createSample(token, seqUploadRow.seqId, owner, sharedProjects);
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
      sampleSharePromises.push(shareSamples(token, `${r}-Group`, [seqUploadRow.seqId])));

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
    formData.append('file', seqUploadRow.read1.file);
    formData.append('file', seqUploadRow.read2.file);

    const headers = {
      'mode': modeOption,
      'seq-type': seqUploadRow.seqType,
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
    if (seqUploadRow.read1.hash !== undefined && seqUploadRow.read2.hash !== undefined) {
      updateState(SeqUploadRowState.CalculatedHash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
