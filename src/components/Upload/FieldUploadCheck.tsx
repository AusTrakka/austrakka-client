import { MenuItem, Paper, Select, Typography } from '@mui/material';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import type React from 'react';
import { SAMPLE_ID_FIELD } from '../../constants/metadataConsts';
import { typesByName } from '../../constants/standaloneClientConstants';
import type { DeducedField } from '../../types/dtos';
import type {Sample} from "../../types/sample.interface";
import {getUniqueValuesArray} from "../../utilities/standaloneClientUtils";

const TYPE_OPTIONS = ['Categorical', 'Numeric', 'Date', 'Geo region (ISO)', 'Free text'];

interface FieldUploadCheckProps {
  fields: DeducedField[];
  setFields: React.Dispatch<React.SetStateAction<DeducedField[]>>;
  csvData: Sample[];
}

function FieldUploadCheck(props: FieldUploadCheckProps) {
  const { fields, setFields, csvData } = props;

  const onTypeChange = (rowData: DeducedField, newType: string) => {
    setFields((prev) => {
      if (!prev) return prev;
      const typeCode = typesByName[newType][3];
      const metaDataColumnValidValues = (typeCode === 'N' || typeCode === 'G')
        ? getUniqueValuesArray(csvData, rowData.columnName)
        : null;
      return prev.map((f) =>
        f.columnName === rowData.columnName
          ? {
              ...f,
              displayedFieldType: newType,
              fieldTypeSource: 'Manual',
              metaDataColumnValidValues,
              primitiveType: typesByName[newType][0],
              canVisualise: typesByName[newType][1],
              geoField: typesByName[newType][2],
            }
          : f,
      );
    });
  };

  const typeBodyTemplate = (rowData: DeducedField) => {
    if (rowData.columnName === SAMPLE_ID_FIELD) {
      return <span>{rowData.displayedFieldType}</span>;
    }
    return (
      <Select
        fullWidth
        size="small"
        value={rowData.displayedFieldType || ''}
        onChange={(e) => onTypeChange(rowData, e.target.value as string)}
        displayEmpty
        variant="standard"
        sx={{ fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit' }}
      >
        {TYPE_OPTIONS.map((opt) => (
          <MenuItem key={opt} value={opt}>
            {opt}
          </MenuItem>
        ))}
      </Select>
    );
  };

  return (
    <Paper>
      <>
        <Typography variant="h4" color="primary">
          Detected fields
        </Typography>
        <DataTable value={fields ?? []} size="small">
          <Column field="columnName" header="Field" />
          <Column field="displayedFieldType" header="Type" body={typeBodyTemplate} />
          <Column field="fieldTypeSource" header="Type Source" />
        </DataTable>
      </>
    </Paper>
  );
}

export default FieldUploadCheck;
