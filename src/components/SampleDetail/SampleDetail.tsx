import { Alert, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { DisplayField, Project, Sample } from '../../types/dtos';
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
  const [displayFields, setDisplayFields] = useState<DisplayField[]>([]);
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
        setDisplayFields(response.data as DisplayField[]);
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
        groupContext: `${project!.projectMembers.id}`,
        filters: `${SAMPLE_ID_FIELD}==${seqId}`,
      });
      const response = await getSamples(token, searchParams.toString());
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
