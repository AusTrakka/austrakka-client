import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import React from 'react';
import { Paper, Typography, Select, MenuItem } from '@mui/material';
import { DeducedField } from '../../types/dtos';
import { typesByName } from '../../constants/standaloneClientConstants';
import { SAMPLE_ID_FIELD } from '../../constants/metadataConsts';

const TYPE_OPTIONS = ['Categorical', 'Numeric', 'Date', 'Free text'];

interface FieldUploadCheckProps {
  fields: DeducedField[];
  setFields: React.Dispatch<React.SetStateAction<DeducedField[]>>;
}

function FieldUploadCheck(props: FieldUploadCheckProps) {
  const { fields, setFields } = props;

  const onTypeChange = (rowData: DeducedField, newType: string) => {
    setFields((prev) => {
      if (!prev) return prev;
      return prev.map((f) =>
        (f.columnName === rowData.columnName
          ? { ...f,
            displayedFieldType: newType,
            fieldTypeSource: 'Manual',
            primitiveType: typesByName[newType][0],
            canVisualise: typesByName[newType][1] }
          : f));
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
        <Typography variant="h4" color="primary">Detected fields</Typography>
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
