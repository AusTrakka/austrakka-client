import { Alert, Paper, Skeleton, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { Field } from '../../types/dtos';
import { Sample } from '../../types/sample.interface';
import { SAMPLE_ID_FIELD } from '../../constants/metadataConsts';
import { useApi } from '../../app/ApiContext';
import LoadingState from '../../constants/loadingState';
import { renderValue } from '../../utilities/helperUtils';
import { ProjectMetadataState, fetchProjectMetadata, selectAwaitingProjectMetadata, selectProjectMetadata } from '../../app/projectMetadataSlice';
import { useAppDispatch, useAppSelector } from '../../app/store';

function SampleDetail() {
  const { projectAbbrev, seqId } = useParams();
  const [colWidth, setColWidth] = useState<number>(100);
  const { token, tokenLoading } = useApi();
  const dispatch = useAppDispatch();

  // Would there be any benefit in more refined selectors which select out sample?
  const projectMetadata : ProjectMetadataState | null =
    useAppSelector(state => selectProjectMetadata(state, projectAbbrev));
  const awaitingMetadata : boolean = useAppSelector((state) =>
    selectAwaitingProjectMetadata(state, projectAbbrev));
  // If not awaiting metadata, at least one view and therefore Seq_ID should be loaded
  const sample = !awaitingMetadata &&
    projectMetadata?.columnLoadingStates[SAMPLE_ID_FIELD] === LoadingState.SUCCESS ?
    projectMetadata?.metadata?.find((s: Sample) => s[SAMPLE_ID_FIELD] === seqId) :
    null;

  useEffect(() => {
    if (projectAbbrev &&
      tokenLoading !== LoadingState.IDLE &&
      tokenLoading !== LoadingState.LOADING
    ) {
      dispatch(fetchProjectMetadata({ projectAbbrev, token }));
    }
  }, [projectAbbrev, token, tokenLoading, dispatch]);

  useEffect(() => {
    if (projectMetadata?.fields && projectMetadata.fields.length > 0) {
      const longestFieldLength = projectMetadata.fields
        .map(field => field.columnName.length)
        .reduce((a, b) => Math.max(a, b));
      setColWidth(longestFieldLength);
    }
  }, [projectMetadata?.fields]);

  const renderRow = (field: Field, value: any) => (
    <TableRow key={field.columnName}>
      <TableCell width={`${colWidth}em`}>{field.columnName}</TableCell>
      <TableCell>
        {(projectMetadata?.columnLoadingStates[field.columnName] === LoadingState.IDLE ||
          projectMetadata?.columnLoadingStates[field.columnName] === LoadingState.LOADING) ?
            <Skeleton variant="text" animation="wave" width="20em" /> :
          renderValue(value, field.columnName, field.primitiveType ?? 'category')}
      </TableCell>
    </TableRow>
  );

  return (
    <>
      <Typography className="pageTitle">
        {`${seqId} (${projectAbbrev} project view)`}
      </Typography>
      {projectMetadata?.errorMessage && <Alert severity="error">{projectMetadata.errorMessage}</Alert>}
      {(sample && projectMetadata?.fields) ? (
        <>
          <Typography>
            {`Information available through project ${projectAbbrev} for record ${seqId} is listed here.`}
          </Typography>
          <TableContainer component={Paper} sx={{ mt: 3 }}>
            <Table>
              <TableBody>
                {projectMetadata?.fields.map(
                  field => renderRow(field, sample[field.columnName]),
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) :
        <Typography>Loading...</Typography>}
    </>
  );
}

export default SampleDetail;
