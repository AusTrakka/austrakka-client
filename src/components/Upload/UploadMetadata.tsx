import React, { useEffect, useState, ChangeEvent } from 'react';
import { Box, FormControl, Grid, InputLabel, Select, Typography, Button,
  FormControlLabel, Checkbox, FormGroup, MenuItem, Drawer, Tooltip, Chip, List, ListItemText, LinearProgress } from '@mui/material';
import { ListAlt, HelpOutline, Rule, FileUpload } from '@mui/icons-material';
import { ResponseObject, getUserProformas } from '../../utilities/resourceUtils';
import { Proforma } from '../../types/dtos';
import isoDateLocalDate from '../../utilities/helperUtils';
import LoadingState from '../../constants/loadingState';
import FileDragDrop from './FileDragDrop';

interface Options {
  validate: boolean,
  blank: boolean,
  append: boolean
}

const uploadOptions = [
  {
    name: 'validate',
    label: 'Validate only',
    description: 'Do not upload metadata, just see validation errors and warnings. This is not a full dry run: it will validate correctness of data against allowed values and types, but will not give a preview of data changes.',
  },
  {
    name: 'blank',
    label: 'Blank cells will delete',
    description: 'Use blank cells in your CSV / XLSX file to indicate that the current cell content should be deleted. If this is not selected, blank cells in the upload will be ignored.',
  },
  {
    name: 'append',
    label: 'Append metadata or update existing samples',
    description: 'Add or update metadata for existing samples. If this is selected, you cannot include new samples in the upload, but may use pro formas that do not include Owner_group.',
  },
];

const validFormats = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];

function UploadInstructions({ setDrawerOpen }: any) {
  return (
    <Box
      sx={{ maxWidth: 600, padding: 6, borderLeft: 6, borderColor: 'secondary.main', height: '100%' }}
      role="presentation"
      onClick={() => setDrawerOpen(false)}
      onKeyDown={() => setDrawerOpen(false)}
    >
      <ListAlt fontSize="large" color="primary" />
      <Typography variant="h4" color="primary">
        Upload Instructions
      </Typography>
      <br />
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
      Excel pro formas include
      <b> three </b>
      worksheets:
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
        <li>
          <b>Seq_ID</b>
          , used as an identifier to match row metadata to sequence data
        </li>
        <li>
          <b>Owner_group</b>
          , used to assign the sample ownership.
          This will affect edit rights over the data.
          Usually a sample will be owned by the Owner group for its organisation
          (for instance, the MDU-Owner group).
        </li>
        <li>
          <b>Shared_groups</b>
          , used to determine who will have permission to view the sample metadata.
          Samples may be shared with multiple groups.
          If a sample is uploaded with an empty Shared_groups value,
          it will not be shared with anyone except the owner group.
        </li>
      </ul>
    </Box>
  );
}

function UploadMetadata() {
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [proformaStatus, setProformaStatus] = useState(LoadingState.IDLE);
  const [proformaStatusMessage, setProformaStatusMessage] = useState('');
  const [selectedProforma, setSelectedProforma] = useState<Proforma>();
  const [options, setOptions] = useState({
    'validate': false,
    'blank': false,
    'append': false,
  } as Options);
  const [file, setFile] = useState();
  const [invalidFile, setInvalidFile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer =
    (open: boolean) =>
      (event: React.KeyboardEvent | React.MouseEvent) => {
        if (
          event.type === 'keydown' &&
        ((event as React.KeyboardEvent).key === 'Tab' ||
          (event as React.KeyboardEvent).key === 'Shift')
        ) {
          return;
        }
        setDrawerOpen(open);
      };

  useEffect(() => {
    setProformaStatus(LoadingState.LOADING);
    const getProformas = async () => {
      const proformaResponse: ResponseObject = await getUserProformas();
      if (proformaResponse.status === 'Success') {
        setProformas(proformaResponse.data);
        setProformaStatus(LoadingState.SUCCESS);
      } else {
        setProformaStatusMessage(proformaResponse.message);
        setProformaStatus(LoadingState.ERROR);
      }
    };

    getProformas();
  }, []);

  // Handle proforma selection
  const handleSelectProforma = (proformaAbbrev: string) => {
    // Find selected proforma object
    const proformaObj = proformas.filter(proforma => proforma.abbreviation === proformaAbbrev);
    setSelectedProforma(proformaObj[0]);
  };

  // Handle upload option change
  const handleOptionChange = (event: ChangeEvent<HTMLInputElement>) => {
    setOptions({
      ...options,
      [event.target.name]: event.target.checked,
    });
  };
  return (
    <>
      <Grid container spacing={2} sx={{ paddingBottom: 4 }} justifyContent="space-between" alignItems="center">
        <Grid item lg={9} md={12}>
          <Typography variant="h2" paddingBottom={1} color="primary">Upload Metadata</Typography>
          <Typography variant="subtitle2" color="primary">
            Please use the supplied pro forma to submit metadata for samples.
            Metadata can be submitted in tabular format, either in CSV or Excel (xlsx) format.
            Files should have extensions
            <code>.csv </code>
            or
            <code>.xlsx</code>
            . If not using the pro forma directly,
            ensure that column names in your CSV or Excel file match those in the pro forma.
          </Typography>
        </Grid>
        <Grid item>
          <Chip
            icon={<HelpOutline />}
            label="View upload instructions"
            onClick={toggleDrawer(true)}
          />
        </Grid>
      </Grid>
      <Grid container spacing={6} alignItems="stretch" sx={{ paddingBottom: 6 }}>
        <Grid item lg={3} md={12} xs={12} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h4" color="primary">Select pro forma </Typography>
          <Tooltip title={proformaStatusMessage} arrow>
            <FormControl
              error={proformaStatus === LoadingState.ERROR}
              size="small"
              sx={{ minWidth: 200, marginTop: 2, marginBottom: 2 }}
              variant="standard"
            >
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
              {proformaStatus === LoadingState.LOADING
                ? (
                  <LinearProgress
                    color="secondary"
                  />
                )
                : null }
            </FormControl>
          </Tooltip>
          { selectedProforma ? (
            <List>
              <ListItemText
                primary="Proforma name"
                secondary={selectedProforma?.name}
                key="name"
              />
              <ListItemText
                primary="Proforma abbreviation"
                secondary={selectedProforma?.abbreviation}
                key="abbrev"
              />
              <ListItemText
                primary="Uploaded"
                secondary={isoDateLocalDate(selectedProforma?.created)}
                key="created"
              />
              <ListItemText
                primary="Uploaded by"
                secondary={selectedProforma?.createdBy}
                key="createdBy"
              />
            </List>
          ) : null}
        </Grid>
        <Grid item lg={4} md={12} xs={12} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h4" color="primary">Select metadata file</Typography>
          <FileDragDrop
            file={file}
            setFile={setFile}
            invalidFile={invalidFile}
            setInvalidFile={setInvalidFile}
            validFormats={validFormats}
          />
        </Grid>
        <Grid item lg={5} md={12} xs={12} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h4" color="primary">Select upload options</Typography>
          <FormGroup>
            { uploadOptions.map(
              (uploadOption: { name: string; label: string; description: string; }) => (
                <Box sx={{ paddingBottom: 1 }} key={uploadOption.name}>
                  <FormControlLabel
                    control={(
                      <Checkbox
                        color="secondary"
                        checked={options[uploadOption.name as keyof Options]}
                        onChange={handleOptionChange}
                        name={uploadOption.name}
                      />
                )}
                    label={<b>{uploadOption.label}</b>}
                  />
                  <Box sx={{ paddingLeft: 4 }}>
                    {uploadOption.description}
                  </Box>
                </Box>
              ),
            ) }
          </FormGroup>
        </Grid>
      </Grid>
      <Grid item container direction="row-reverse">
        {/* TODO: Disable if no proforma selected or file present, or invalid file type */}
        { options.validate ? (
          <Button variant="contained" disabled={!selectedProforma || !file || invalidFile} endIcon={<Rule />}>
            Validate metadata
          </Button>
        )
          : (
            <Button variant="contained" disabled={!selectedProforma || !file || invalidFile} endIcon={<FileUpload />}>
              Upload metadata
            </Button>
          )}
      </Grid>
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        <UploadInstructions setDrawerOpen={setDrawerOpen} />
      </Drawer>
    </>
  );
}
export default UploadMetadata;
