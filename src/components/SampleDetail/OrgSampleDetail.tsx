import { Alert, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { DisplayField, Project, Sample } from '../../types/dtos';
import { ResponseObject, getDisplayFields, getProjectDetails, getSamples } from '../../utilities/resourceUtils';
import { SAMPLE_ID_FIELD } from '../../constants/metadataConsts';

function OrgSampleDetail() {
  const { seqId, groupContext, groupAbbrev } = useParams();
  const [project, setProject] = useState<Project | null>();
  const [displayFields, setDisplayFields] = useState<DisplayField[]>([]);
  const [data, setData] = useState<Sample | null>();
  const [colWidth, setColWidth] = useState<number>(100);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // Will need this but idk if project
  useEffect(() => {
    const updateDisplayFields = async () => {
      const response = await getDisplayFields(Number(groupContext));
      if (response.status === 'Success') {
        setDisplayFields(response.data as DisplayField[]);
      } else {
        setErrMsg(`Metadata fields for group ${groupAbbrev} could not be loaded`);
      }
    };
    updateDisplayFields();
  }, [groupContext, groupAbbrev]);

  useEffect(() => {
    const updateSampleData = async () => {
      const searchParams = new URLSearchParams({
        groupContext: `${groupContext}`,
        filters: `${SAMPLE_ID_FIELD}==${seqId}`,
      });
      const response = await getSamples(searchParams.toString());
      if (response.status === 'Success' && response.data.length > 0) {
        setData(response.data[0] as Sample);
      } else {
        setErrMsg(`Record ${seqId} could not be found within the context of group ${groupAbbrev}`);
      }
    };
    updateSampleData();
  }, [groupContext, seqId, groupAbbrev]);

  useEffect(() => {
    if (displayFields.length > 0) {
      const longestFieldLength = displayFields
        .map(field => field.columnName.length)
        .reduce((a, b) => Math.max(a, b));
      setColWidth(longestFieldLength);
    }
  }, [displayFields]);

  const renderRow = (field: string, value: string) => (
    <TableRow key={field}>
      <TableCell width={`${colWidth}em`}>{field}</TableCell>
      <TableCell>{value}</TableCell>
    </TableRow>
  );

  return (
    <>
      <Typography className="pageTitle">
        {`${seqId} (${groupAbbrev} view)`}
      </Typography>
      {errMsg ? <Alert severity="error">{errMsg}</Alert> : (
        <>
          <Typography>
            {`Information available through project ${groupAbbrev} for record ${seqId} is listed here.`}
          </Typography>
          <TableContainer component={Paper} sx={{ mt: 3 }}>
            <Table>
              <TableBody>
                {data &&
                  displayFields
                    .sort((a, b) => a.columnOrder - b.columnOrder)
                    .map(field => renderRow(field.columnName, (data as any)[field.columnName]))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </>
  );
}
export default OrgSampleDetail;
