import React, { useEffect, useState, ChangeEvent } from 'react';
import { Box, FormControl, Grid, InputLabel, Select, Typography, Button, FormControlLabel, Checkbox, FormGroup, MenuItem, Alert } from '@mui/material';
import { UploadFile } from '@mui/icons-material';
import { ResponseObject, getUserProformas } from '../../utilities/resourceUtils';
import { Proforma } from '../../types/dtos';

function UploadInstructions() {
  return (
    <>
      <Typography variant="h4" color="primary">
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
    </>
  );
}

function UploadMetadata() {
  // Post: Upload
  // Post: Append
  // Post: Validate
  // Post: Blank delete
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [selectedProforma, setSelectedProforma] = useState<Proforma>();
  const [options, setOptions] = useState({
    validate: false,
    blank: false,
    append: false,
  });
  const [invalidFile] = useState(true);

  useEffect(() => {
    const getProformas = async () => {
      const proformaResponse: ResponseObject = await getUserProformas();
      if (proformaResponse.status === 'Success') {
        setProformas(proformaResponse.data);
      } else {
        // TODO: Error handling
        console.log('Error');
      }
    };

    getProformas();
  }, []);

  const handleSelectProforma = (proformaAbbrev: string) => {
    // Find selected proforma object
    const proformaObj = proformas.filter(proforma => proforma.abbreviation === proformaAbbrev);
    setSelectedProforma(proformaObj[0]);
  };

  const handleOptionChange = (event: ChangeEvent<HTMLInputElement>) => {
    setOptions({
      ...options,
      [event.target.name]: event.target.checked,
    });
  };
  return (
    <>
      <Typography variant="h2" paddingBottom={1} color="primary">Upload Metadata</Typography>
      <Grid container spacing={8}>
        <Grid item xs={4}>
          <UploadInstructions />
        </Grid>
        <Grid item xs={8}>
          <Typography variant="h4" color="primary">Select and upload pro forma</Typography>
          <FormControl size="small" sx={{ minWidth: 200, marginTop: 2, marginBottom: 2 }} variant="standard">
            <InputLabel id="proforma-simple-select-label">Pro forma</InputLabel>
            <Select
              labelId="proforma-simple-select-label"
              id="proforma-simple-select-label"
              label="Pro forma"
              name="proforma"
              value={selectedProforma?.abbreviation || ''}
              onChange={(e) => handleSelectProforma(e.target.value)}
              autoWidth
            >
              { proformas.map((proforma: Proforma) => (
                <MenuItem
                  value={proforma.abbreviation}
                  key={proforma.abbreviation}
                >
                  {`${proforma.abbreviation} : ${proforma.name}`}
                </MenuItem>
              )) }
            </Select>
          </FormControl>
          <Box sx={{ p: 4, backgroundColor: 'rgb(238, 242, 246)', marginTop: 2, marginBottom: 2, textAlign: 'center' }}>
            <UploadFile fontSize="large" color="primary" />
            <Typography variant="h5" color="primary">Drag and drop file here</Typography>
            <Typography variant="subtitle1">or</Typography>
            <Button variant="contained">Browse</Button>
          </Box>
          {/* TODO: Fix layout of checkboxes so they can include sub descriptions */}
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox checked={options.validate} onChange={handleOptionChange} name="validate" />
            }
              label="Validate only"
            />
            <FormControlLabel
              control={
                <Checkbox checked={options.blank} onChange={handleOptionChange} name="blank" />
            }
              label="Blank cells will delete"
            />
            <FormControlLabel
              control={
                <Checkbox checked={options.append} onChange={handleOptionChange} name="append" />
            }
              label="Append metadata or update existing samples"
            />
          </FormGroup>
          <Grid container justifyContent="space-between" alignItems="center" spacing={2}>
            <Grid item xs>
              { invalidFile && <Alert severity="error">Invalid file type. Valid file types are: .csv, .xls, .xlsx</Alert> }
            </Grid>
            <Grid item>
              {/* TODO: Buttons have to be disabled if no file present, or invalid file type */}
              { options.validate ? (
                <Button variant="contained" disabled={invalidFile!}>
                  Validate
                </Button>
              )
                : (
                  <Button variant="contained" disabled={invalidFile!}>
                    Upload
                  </Button>
                )}
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
export default UploadMetadata;
