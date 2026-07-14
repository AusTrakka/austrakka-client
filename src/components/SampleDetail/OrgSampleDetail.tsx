import {
  Alert,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '../../app/ApiContext';
import LoadingState from '../../constants/loadingState';
import { SAMPLE_ID_FIELD } from '../../constants/metadataConsts';
import { ResponseType } from '../../constants/responseType';
import { columnStyleRules } from '../../styles/metadataFieldStyles';
import type { Field, Group, MetaDataColumn } from '../../types/dtos';
import type { ResponseObject } from '../../types/responseObject.interface';
import type { Sample } from '../../types/sample.interface';
import { renderValue } from '../../utilities/renderUtils';
import { getOrgFields, getOrgMetadata, getSampleGroups } from '../../utilities/resourceUtils';

function SampleDetail() {
  const { seqId } = useParams();
  const [displayFields, setDisplayFields] = useState<MetaDataColumn[]>([]);
  const [data, setData] = useState<Sample | null>();
  const [colWidth, setColWidth] = useState<number>(100);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [errToast, setErrToast] = useState<boolean>(false);
  const [orgAbbrev, setOrgAbbrev] = useState<string | null>(null);
  const { token, tokenLoading } = useApi();

  const handleClose = (_event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      setErrToast(false);
      return;
    }
    setErrToast(false);
  };

  useEffect(() => {
    const updateProject = async () => {
      try {
        const sampleResponse: ResponseObject = await getSampleGroups(seqId!, token);
        if (sampleResponse.status === ResponseType.Success) {
          const groupsData = sampleResponse.data as Group[];
          const ownerAbbrev = groupsData.find((g) => g.name.endsWith('-Owner'))?.organisation
            .abbreviation;
          if (ownerAbbrev === undefined) {
            // biome-ignore lint/suspicious/noConsole: historic
            console.error('Organisation Owner group cannot be found for the current user');
            return;
          }
          setOrgAbbrev(ownerAbbrev);
        } else {
          setErrMsg(`Sample: ${seqId} could not be accessed`);
        }
      } catch (error) {
        // biome-ignore lint/suspicious/noConsole: historic
        console.error('Error updating project:', error);
      }
    };
    if (
      (seqId || orgAbbrev) &&
      tokenLoading !== LoadingState.LOADING &&
      tokenLoading !== LoadingState.IDLE
    ) {
      updateProject();
    }
  }, [token, seqId, orgAbbrev, tokenLoading]);

  useEffect(() => {
    const updateDisplayFields = async () => {
      try {
        if (orgAbbrev) {
          const response = await getOrgFields(orgAbbrev, token);
          if (response.status === ResponseType.Success) {
            setDisplayFields(response.data as MetaDataColumn[]);
          } else {
            setErrMsg(`Metadata fields for ${orgAbbrev} could not be loaded`);
          }
        }
      } catch (error) {
        // biome-ignore lint/suspicious/noConsole: historic
        console.error('Error updating display fields:', error);
      }
    };

    // Make sure orgAbbrev is not null before updating display fields
    if (orgAbbrev && tokenLoading !== LoadingState.LOADING && tokenLoading !== LoadingState.IDLE) {
      updateDisplayFields();
    }
  }, [token, tokenLoading, orgAbbrev]);

  useEffect(() => {
    const updateSampleData = async () => {
      const searchParams = new URLSearchParams({
        filters: `${SAMPLE_ID_FIELD}==${seqId}`,
      });
      const response = await getOrgMetadata(orgAbbrev as string, token, searchParams);

      // @ts-expect-error
      if (response.status === ResponseType.Success && response.data.length > 0) {
        setData(response.data![0] as Sample);
      } else {
        setErrMsg(`Record ${seqId} could not be found within the context of ${orgAbbrev}`);
      }
    };
    if (orgAbbrev && tokenLoading !== LoadingState.LOADING && tokenLoading !== LoadingState.IDLE) {
      updateSampleData();
    }
  }, [token, tokenLoading, orgAbbrev, seqId]);

  useEffect(() => {
    if (displayFields.length > 0) {
      const longestFieldLength = displayFields
        .map((field) => field.columnName.length)
        .reduce((a, b) => Math.max(a, b));
      setColWidth(longestFieldLength);
    }
  }, [displayFields]);

  const renderRow = (field: Field, value: string) => (
    <TableRow key={field.columnName}>
      <TableCell width={`${colWidth}em`}>{field.columnName}</TableCell>
      <TableCell className={columnStyleRules[field.columnName]}>
        {renderValue(value, field.columnName, field.primitiveType ?? 'category')}
      </TableCell>
    </TableRow>
  );

  return (
    <>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={errToast}
        autoHideDuration={6000}
        onClose={handleClose}
      ></Snackbar>
      <Typography className="pageTitle">{seqId}</Typography>
      {errMsg ? (
        <Alert severity="error">{errMsg}</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableBody>
              {data &&
                displayFields
                  .sort((a, b) => a.columnOrder - b.columnOrder)
                  .map((field) => renderRow(field, (data as any)[field.columnName]))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
}
export default SampleDetail;
