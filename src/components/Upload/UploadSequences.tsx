import React, { Box, Typography, FormControl, InputLabel, Select, MenuItem, LinearProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import LoadingState from '../../constants/loadingState';
import {getEnumByValue} from '../../utilities/enumUtils';

enum SeqType {
    FastqIllPe = 'fastq-ill-pe',
    FastqIllSe = 'fastq-ill-se',
    FastqOnt = 'fastq-ont',
}

enum SkipForce {
    Skip = 'skip',
    Force = 'force',
}

function UploadSequences() {
  useEffect(() => {
  }, []);

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
    </Box>
  );
}
export default UploadSequences;
