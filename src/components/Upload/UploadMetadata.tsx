import React, { useEffect } from 'react';
import { Box, FormControl, Grid, InputLabel, Select, Typography, Button } from '@mui/material';
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';

function UploadInstructions() {
  return (
    <>
      <Typography variant="h3">
        Instructions
      </Typography>
      <Typography>Please use the supplied pro forma to submit metadata for samples.</Typography>
      <br />
      Metadata can be submitted in tabular format, either in CSV or Excel (xlsx) format.
      Files should have extensions
      <code>.csv </code>
      or
      <code>.xlsx</code>
      . If not using the pro forma directly,
      ensure that column names in your CSV or Excel file match those in the pro forma.
      <br />
      <br />
      Excel pro formas include three worksheets:
      <ul>
        <li>The metadata pro forma itself</li>
        <li>A data dictionary, describing the usage of metadata fields</li>
        <li>A type dictionary, specifying allowed values for fields, where applicable</li>
      </ul>
      The first row of data is considered to be the header.
      When using an Excel pro forma the first tab will be used as the sample metadata table.
      <br />
      <br />
      Special columns, required in certain pro formas, are:
      <ul>
        <li>Seq_ID, used as an identifier to match row metadata to sequence data</li>
        <li>
          Owner_group, used to assign the sample ownership.
          This will affect edit rights over the data.
          Usually a sample will be owned by the Owner group for its organisation
          (for instance, the MDU-Owner group).
        </li>
        <li>
          Shared_groups, used to determine who will have permission to view the sample metadata.
          Samples may be shared with multiple groups.
          If a sample is uploaded with an empty Shared_groups value,
          it will not be shared with anyone except the owner group.
        </li>
      </ul>
      <br />
      <RuleOutlinedIcon />
      <Typography variant="h6">Validate mode</Typography>
      Select Validate only if you would like to perform a &ldquo;dry run&rdquo; upload.
      This will show validation warnings and errors for the supplied file,
      but will not upload any data.
      <br />
      <br />
      <AddCircleOutlineOutlinedIcon />
      <Typography variant="h6">Append mode</Typography>
      Select Append metadata to upload data in &ldquo;append mode&rdquo;.
      In this mode, metadata will be added to existing sample records,
      but new samples cannot be included in the upload.
      In this mode, the field Owner_group is no longer required and will be ignored.
    </>
  );
}

function UploadMetadata() {
  // Get: List of proformas
  // Post: Upload
  // Post: Append
  // Post: Validate

  useEffect(() => {
  }, []);

  return (
    <Box>
      <Typography variant="h2" color="primary" sx={{ marginBottom: '10px' }}>
        Upload Metadata
      </Typography>
      <Grid container>
        <Grid item xs={8}>
          <UploadInstructions />
        </Grid>
        <Grid item xs={4}>
          <Typography variant="h3">Upload Pro forma</Typography>
          <Typography>Select the pro forma and file you would like to upload.</Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="proforma-simple-select-label">Pro forma</InputLabel>
            <Select
              labelId="proforma-simple-select-label"
              id="proforma-simple-select-label"
              label="Pro forma"
              name="proforma"
            />
          </FormControl>
          <Box sx={{ p: 2, border: '1px dashed grey' }}>
            Drag and drop file here or
            <Button variant="contained">Browse files</Button>
          </Box>
          <Button variant="contained">
            Upload
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
export default UploadMetadata;
