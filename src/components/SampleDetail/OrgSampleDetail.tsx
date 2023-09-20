import { Alert, FormControl, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { DisplayField, Group, Sample } from '../../types/dtos';
import { ResponseObject, getDisplayFields, getSampleGroups, getSamples } from '../../utilities/resourceUtils';
import { SAMPLE_ID_FIELD } from '../../constants/metadataConsts';

function SampleDetail() {
  const { seqId, groupName } = useParams();
  const [groups, setGroups] = useState<Group[] | null>();
  const [selectedGroup, setSelectedGroup] = useState<Group>();
  const [displayFields, setDisplayFields] = useState<DisplayField[]>([]);
  const [data, setData] = useState<Sample | null>();
  const [colWidth, setColWidth] = useState<number>(100);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    const updateProject = async () => {
      try {
        const sampleResponse: ResponseObject = await getSampleGroups(seqId!);
        if (sampleResponse.status === 'Success') {
          setGroups(sampleResponse.data as Group[]);
          // Check if selectedGroup is already set, otherwise set it
          if (!selectedGroup && groupName !== undefined) {
            setSelectedGroup(groups?.find(group => group.name === groupName));
          } else if (!selectedGroup) {
            setSelectedGroup(sampleResponse.data[0]);
          }
        } else {
          setErrMsg(`Sample: ${seqId} could not be accessed`);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error updating project:', error);
      }
    };
    if (seqId || groupName) {
      updateProject();
    }
  }, [seqId, groups, groupName, selectedGroup]);

  useEffect(() => {
    const updateDisplayFields = async () => {
      try {
        if (selectedGroup) {
          const response = await getDisplayFields(selectedGroup.groupId!);
          if (response.status === 'Success') {
            setDisplayFields(response.data as DisplayField[]);
          } else {
            setErrMsg(`Metadata fields for ${selectedGroup.name} could not be loaded`);
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error updating display fields:', error);
      }
    };

    // Make sure selectedGroup is not null before updating display fields
    if (selectedGroup) {
      updateDisplayFields();
    }
  }, [selectedGroup]);

  useEffect(() => {
    const updateSampleData = async () => {
      const searchParams = new URLSearchParams({
        groupContext: `${selectedGroup?.groupId}`,
        filters: `${SAMPLE_ID_FIELD}==${seqId}`,
      });
      const response = await getSamples(searchParams.toString());
      if (response.status === 'Success' && response.data.length > 0) {
        setData(response.data[0] as Sample);
      } else {
        setErrMsg(`Record ${seqId} could not be found within the context of ${selectedGroup!.name}`);
      }
    };
    if (selectedGroup) {
      updateSampleData();
    }
  }, [selectedGroup, seqId]);

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
        {`${seqId} (${selectedGroup?.name} view)`}
      </Typography>
      {errMsg ? <Alert severity="error">{errMsg}</Alert> : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography>
              {`Information available through ${selectedGroup?.name} for record ${seqId} is listed here.`}
            </Typography>
            <FormControl
              variant="standard"
              sx={{ marginX: 1, margin: 1, minWidth: 220, minHeight: 20 }}
            >
              <Select
                labelId="org-select-label"
                id="org-select"
                defaultValue=""
                value={selectedGroup ? selectedGroup.name : ''}
                onChange={(e) => {
                  const selectedGroupName = e.target.value;
                  const selected = groups?.find(group => group.name === selectedGroupName);

                  if (selected) {
                    setSelectedGroup(selected);
                  } else {
                    // eslint-disable-next-line no-console
                    console.error(`Group with name ${selectedGroupName} not found.`);
                  }
                }}
                label="Organisation group"
                autoWidth
              >
                {groups?.map(group => (
                  <MenuItem key={group.groupId} value={group.name}>
                    {group.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
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
export default SampleDetail;
