import React from "react";
import {Typography} from "@mui/material";

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
      Excel proformas include
      <b> three </b>
      worksheets:
      <ul>
        <li>The metadata proforma itself</li>
        <li>A data dictionary, describing the usage of metadata fields</li>
        <li>A type dictionary, specifying allowed values for fields, where applicable</li>
      </ul>
      The first row of data is considered to be the header.
      When using an Excel proforma the first tab will be used as the sample metadata table.
      <br />
      <br />
      Special columns, required in certain proformas, are:
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
    </>
  )
}