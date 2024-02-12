import { Alert, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { MetaDataColumn, Project } from '../../types/dtos';
import { Sample } from '../../types/sample.interface';
import { getDisplayFields, getProjectDetails, getSamples } from '../../utilities/resourceUtils';
import { SAMPLE_ID_FIELD } from '../../constants/metadataConsts';
import { useApi } from '../../app/ApiContext';
import LoadingState from '../../constants/loadingState';
import { ResponseObject } from '../../types/responseObject.interface';
import { ResponseType } from '../../constants/responseType';
import { renderValue } from '../../utilities/helperUtils';

function SampleDetail() {
  const { projectAbbrev, seqId } = useParams();
  const [project, setProject] = useState<Project | null>();
  const [displayFields, setDisplayFields] = useState<MetaDataColumn[]>([]);
  const [data, setData] = useState<Sample | null>();
  const [colWidth, setColWidth] = useState<number>(100);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const { token, tokenLoading } = useApi();

  useEffect(() => {
    const updateProject = async () => {
      const projectResponse: ResponseObject = await getProjectDetails(projectAbbrev!, token);
      if (projectResponse.status === ResponseType.Success) {
        setProject(projectResponse.data as Project);
      } else {
        setErrMsg(`Project ${projectAbbrev} could not be accessed`);
      }
    };
    if (tokenLoading !== LoadingState.LOADING &&
      tokenLoading !== LoadingState.IDLE) {
      updateProject();
    }
  }, [projectAbbrev, token, tokenLoading]);

  useEffect(() => {
    const updateDisplayFields = async () => {
      const response = await getDisplayFields(project!.projectMembers.id, token);
      if (response.status === ResponseType.Success) {
        setDisplayFields(response.data as MetaDataColumn[]);
      } else {
        setErrMsg(`Metadata fields for project ${project!.abbreviation} could not be loaded`);
      }
    };
    if (project &&
      tokenLoading !== LoadingState.LOADING &&
      tokenLoading !== LoadingState.IDLE) {
      updateDisplayFields();
    }
  }, [project, token, tokenLoading]);

  useEffect(() => {
    const updateSampleData = async () => {
      const searchParams = new URLSearchParams({
        filters: `${SAMPLE_ID_FIELD}==${seqId}`,
      });
      const response = await getSamples(token, project!.projectMembers.id, searchParams);
      if (response.status === ResponseType.Success && response.data.length > 0) {
        setData(response.data[0] as Sample);
      } else {
        setErrMsg(`Record ${seqId} could not be found within the context of project ${project!.abbreviation}`);
      }
    };
    if (project &&
      tokenLoading !== LoadingState.LOADING &&
      tokenLoading !== LoadingState.IDLE) {
      updateSampleData();
    }
  }, [project, seqId, token, tokenLoading]);

  useEffect(() => {
    if (displayFields.length > 0) {
      const longestFieldLength = displayFields
        .map(field => field.columnName.length)
        .reduce((a, b) => Math.max(a, b));
      setColWidth(longestFieldLength);
    }
  }, [displayFields]);

  // Will need to become MetaDataColumn on merge
  const renderRow = (field: DisplayField, value: any) => (
    <TableRow key={field.columnName}>
      <TableCell width={`${colWidth}em`}>{field.columnName}</TableCell>
      <TableCell>{ renderValue(value, field.columnName, field.primitiveType) }</TableCell>
    </TableRow>
  );

  return (
    <>
      <Typography className="pageTitle">
        {`${seqId} (${projectAbbrev} project view)`}
      </Typography>
      {errMsg ? <Alert severity="error">{errMsg}</Alert> : (
        <>
          <Typography>
            {`Information available through project ${projectAbbrev} for record ${seqId} is listed here.`}
          </Typography>
          <TableContainer component={Paper} sx={{ mt: 3 }}>
            <Table>
              <TableBody>
                {data &&
                displayFields
                  .sort((a, b) => a.columnOrder - b.columnOrder)
                  .map(field => renderRow(field, (data as any)[field.columnName]))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </>
  );
}
export default SampleDetail;
