import {
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '../../app/ApiContext';
import {
  fetchProjectMetadata,
  type ProjectMetadataState,
  selectProjectMetadata,
} from '../../app/projectMetadataSlice';
import { useAppDispatch, useAppSelector } from '../../app/store';
import LoadingState from '../../constants/loadingState';
import { SAMPLE_ID_FIELD } from '../../constants/metadataConsts';
import { hasCompleteData } from '../../constants/metadataLoadingState';
import { columnStyleRules } from '../../styles/metadataFieldStyles';
import type { Field } from '../../types/dtos';
import type { Sample } from '../../types/sample.interface';
import { renderValue } from '../../utilities/renderUtils';

function SampleDetail() {
  const { projectAbbrev, seqId } = useParams();
  const [colWidth, setColWidth] = useState<number>(100);
  const { token, tokenLoading } = useApi();
  const dispatch = useAppDispatch();

  const projectMetadata: ProjectMetadataState | null = useAppSelector((state) =>
    selectProjectMetadata(state, projectAbbrev),
  );
  const sample = hasCompleteData(projectMetadata?.loadingState)
    ? projectMetadata?.metadata?.find((s: Sample) => s[SAMPLE_ID_FIELD] === seqId)
    : null;

  useEffect(() => {
    if (
      projectAbbrev &&
      tokenLoading !== LoadingState.IDLE &&
      tokenLoading !== LoadingState.LOADING
    ) {
      dispatch(fetchProjectMetadata({ projectAbbrev, token }));
    }
  }, [projectAbbrev, token, tokenLoading, dispatch]);

  useEffect(() => {
    if (projectMetadata?.fields && projectMetadata.fields.length > 0) {
      const longestFieldLength = projectMetadata.fields
        .map((field) => field.columnName.length)
        .reduce((a, b) => Math.max(a, b));
      setColWidth(longestFieldLength);
    }
  }, [projectMetadata?.fields]);

  const renderRow = (field: Field, value: any) => (
    <TableRow key={field.columnName}>
      <TableCell width={`${colWidth}em`}>{field.columnName}</TableCell>
      <TableCell className={columnStyleRules[field.columnName]}>
        {renderValue(value, field.columnName, field.primitiveType ?? 'category')}
      </TableCell>
    </TableRow>
  );

  return (
    <>
      <Typography className="pageTitle">{`${seqId} (${projectAbbrev} project view)`}</Typography>
      {projectMetadata?.errorMessage && (
        <Alert severity="error">{projectMetadata.errorMessage}</Alert>
      )}
      {sample && projectMetadata?.fields ? (
        <>
          <Typography>
            {`Information available through project ${projectAbbrev} for record ${seqId} is listed here.`}
          </Typography>
          <TableContainer component={Paper} sx={{ mt: 3 }}>
            <Table>
              <TableBody>
                {projectMetadata.fields.map((field) => renderRow(field, sample[field.columnName]))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <Typography>Loading...</Typography>
      )}
    </>
  );
}

export default SampleDetail;
