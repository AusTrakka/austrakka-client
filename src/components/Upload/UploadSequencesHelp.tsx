import React from 'react';
import { Box, Typography } from '@mui/material';

// can be used elsewhere or maybe I should put this in the Theme file.
function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <Box
      component="code"
      sx={{
        fontFamily: 'monospace',
        fontSize: '0.875em',
        backgroundColor: 'action.hover',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '4px',
        paddingX: '4px',
        paddingY: '1px',
      }}
    >
      {children}
    </Box>
  );
}

export default function UploadSequencesHelp() {
  return (
    <>
      <Typography variant="body1" color="textPrimary" paddingBottom={2}>
        Drag and drop your sequence files into the upload box, or click to select them.
        {' '}
        {/** will need to see how to link to docs page depending on the env* */}
      </Typography>

      <Typography variant="h4" color="textPrimary" paddingBottom={2}>
        File types
      </Typography>
      <Typography variant="body1" color="textPrimary" paddingBottom={1}>
        <strong>FASTQ and FASTA assembly files.</strong>
        {' '}
        {import.meta.env.VITE_BRANDING_NAME}
        {' '}
        will
        try to read the
        {' '}
        <InlineCode>Seq_ID</InlineCode>
        {' '}
        from each filename, using everything before
        the first underscore (_). It will also try to pair files into read pairs (R1 and R2)
        automatically. You can review and edit these assignments before submitting.
      </Typography>
      <Typography variant="body1" color="textPrimary" paddingBottom={2}>
        <strong>Consensus FASTA files.</strong>
        {' '}
        You can include multiple samples in a single file.
        Each sequence record (identified by its header line) is treated as a separate sample, and
        its
        <InlineCode>Seq_ID</InlineCode>
        {' '}
        will be taken from the header, not the filename.
      </Typography>

      <Typography variant="h4" color="textPrimary" paddingBottom={2}>
        Seq_IDs and duplicates
      </Typography>
      <Typography variant="body1" color="textPrimary" paddingBottom={1}>
        If
        {' '}
        {import.meta.env.VITE_BRANDING_NAME}
        {' '}
        detects that sequence data already exists for a
        {' '}
        <InlineCode>Seq_ID</InlineCode>
        {' '}
        you are uploading, it will skip that file and show an error
        by default. You can change this behaviour:
      </Typography>
      <ul>
        <li>
          <InlineCode>Skip</InlineCode>
          {' '}
          will silently ignore any
          <InlineCode>Seq_ID</InlineCode>
          {' '}
          that already has data, with no error shown.
        </li>
        <li>
          <InlineCode>Force</InlineCode>
          {' '}
          will overwrite existing data for matching
          {' '}
          <InlineCode>Seq_IDs</InlineCode>
          . Only data of the same type you are uploading will be
          affected.
        </li>
      </ul>
      <Typography variant="body1" color="textPrimary">
        If an upload partially fails, you can resubmit the same files with
        {' '}
        <InlineCode>Skip</InlineCode>
        {' '}
        selected. Successfully uploaded samples will be ignored and
        only the remaining files will be processed.
      </Typography>
    </>
  );
}
