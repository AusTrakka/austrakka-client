import React, { useEffect, useState } from 'react';
import { Alert, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { MetaDataColumn } from '../../types/dtos';
import { ResponseObject } from '../../types/responseObject.interface';
import { getFields } from '../../utilities/resourceUtils';
import { useApi } from '../../app/ApiContext';
import { ResponseType } from '../../constants/responseType';
import LoadingState from '../../constants/loadingState';

function Fields() {
  const [fields, setFields] = useState<MetaDataColumn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { token, tokenLoading } = useApi();

  // get all AT fields
  useEffect(() => {
    const retrieveFields = async () => {
      const response: ResponseObject = await getFields(token);
      if (response.status === ResponseType.Success) {
        const fields: MetaDataColumn[] = response.data;
        fields.sort((a,b) => a.columnOrder - b.columnOrder);
        setFields(fields);
      } else if (response.status === ResponseType.Error) {
        setError(response.message);
      }
    };
    // TODO use this everywhere, not not idle/loading
    if (tokenLoading === LoadingState.SUCCESS) {
      retrieveFields();
    }
  }, [token, tokenLoading]);

  const renderAllowedValues = (allowedValues: string[] | null): string => {
    if (allowedValues === null || allowedValues.length === 0) return '';
    return allowedValues.join(', ');
  };

  return (
    <>
      <Typography className="pageTitle">Fields</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {/* TODO probably replace with better table */}
      {/* TODO add descriptions in fields, and include e.g. NA is discouraged */}
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Field name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Allowed values (if categorical)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((field) => (
              <TableRow key={field.columnName}>
                <TableCell>{field.columnName}</TableCell>
                <TableCell>{field.primitiveType ?? 'categorical'}</TableCell>
                <TableCell>{renderAllowedValues(field.metaDataColumnValidValues)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

export default Fields;
