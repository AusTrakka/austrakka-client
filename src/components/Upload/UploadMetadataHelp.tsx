/* eslint-disable react/jsx-one-expression-per-line */
import React from 'react';
import { Typography } from '@mui/material';

export default function UploadMetadataHelp() {
  return (
    <>
      <Typography>Please use the supplied proforma to submit metadata for samples.</Typography>
      <br />
      Metadata can be submitted in tabular format, either in CSV or Excel (xlsx) format.
      Files should have extensions
      <code> .csv </code>
      or
      <code> .xlsx</code>
      . If not using the proforma directly,
      ensure that column names in your CSV or Excel file match those in the proforma.
      <br />
      <br />
      The <b>Seq_ID</b> column is required and will be taken to be the primary identifier for the
      record. It is used to match metadata between uploads, and match metadata to sequence files.
      <br />
      <br />
      Excel proforma templates will include at least <b> three </b> worksheets:
      <ul>
        <li>The metadata proforma itself</li>
        <li>A data dictionary, describing the usage of metadata fields</li>
        <li>A type dictionary, specifying allowed values for fields, where applicable</li>
      </ul>
      The first row of the spreadsheet is considered to be the header row.
      When using an Excel proforma the first worksheet will be used as the sample metadata table.
    </>
  );
}
