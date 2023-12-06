import { Alert, FormControl, MenuItem, Paper, Select, Snackbar, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { DisplayField, Group, Sample } from '../../types/dtos';
import { ResponseObject, getDisplayFields, getSampleGroups, getSamples } from '../../utilities/resourceUtils';
import { SAMPLE_ID_FIELD } from '../../constants/metadataConsts';
import { useStateFromSearchParamsForPrimitive } from '../../utilities/helperUtils';
import { useApi } from '../../app/ApiContext';
import LoadingState from '../../constants/loadingState';

function SampleDetail() {
  const { seqId } = useParams();
  const [groupName, setGroupName] = useStateFromSearchParamsForPrimitive<string | null>(
    'groupName',
    null,
    new URLSearchParams(window.location.search),
  );
  const [groups, setGroups] = useState<Group[] | null>();
  const [errorGroupName, setErrorGroupName] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group>();
  const [displayFields, setDisplayFields] = useState<DisplayField[]>([]);
  const [data, setData] = useState<Sample | null>();
  const [colWidth, setColWidth] = useState<number>(100);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [errToast, setErrToast] = useState<boolean>(false);
  const { token, tokenLoading } = useApi();

  const handleClose = (event: React.SyntheticEvent | Event, reason?: string) => {
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
        if (sampleResponse.status === 'Success') {
          const groupsData = sampleResponse.data as Group[];
          const ownerAbbrev = groupsData.find(g => g.name.endsWith('-Everyone'))?.organisation.abbreviation;
          if (ownerAbbrev === undefined) {
            // eslint-disable-next-line no-console
            console.error('Organisation Everyone group cannot be found for the current user');
          }
          const sortedGroups = groupsData.sort((groupA, groupB) => {
            if (groupA.name.endsWith('-Owner') && !groupB.name.endsWith('-Owner')) {
              return -1;
            } if (!groupA.name.endsWith('-Owner') && groupB.name.endsWith('-Owner')) {
              return 1;
            } if (groupA.name.includes(ownerAbbrev!) && !groupB.name.includes(ownerAbbrev!)) {
              return -1;
            } if (!groupA.name.includes(ownerAbbrev!) && groupB.name.includes(ownerAbbrev!)) {
              return 1;
            }
            return 0;
          });
          setGroups(sortedGroups);
        } else {
          setErrMsg(`Sample: ${seqId} could not be accessed`);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error updating project:', error);
      }
    };
    if ((seqId || groupName) && tokenLoading !== LoadingState.LOADING &&
    tokenLoading !== LoadingState.IDLE) {
      updateProject();
    }
  }, [token, seqId, groupName, selectedGroup, tokenLoading]);

  useEffect(() => {
    if (groups) {
      // Check if selectedGroup is already set, otherwise set it
      if (!selectedGroup && (groups.some(g => g.name === groupName))) {
        setSelectedGroup(groups?.find(group => group.name === groupName));
      } else if (!selectedGroup) {
        if (groupName) {
          setErrToast(true);
          setErrorGroupName(groupName);
        }
        setSelectedGroup(groups[0]);
      }
      if (selectedGroup) {
        setGroupName(selectedGroup.name);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupName, groups, selectedGroup]);

  useEffect(() => {
    const updateDisplayFields = async () => {
      try {
        if (selectedGroup) {
          const response = await getDisplayFields(selectedGroup.groupId!, token);
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
    if (selectedGroup && tokenLoading !== LoadingState.LOADING &&
      tokenLoading !== LoadingState.IDLE) {
      updateDisplayFields();
    }
  }, [token, tokenLoading, selectedGroup]);

  useEffect(() => {
    const updateSampleData = async () => {
      const searchParams = new URLSearchParams({
        filters: `${SAMPLE_ID_FIELD}==${seqId}`,
      });
      const response = await getSamples(token, selectedGroup?.groupId, searchParams);
      if (response.status === 'Success' && response.data.length > 0) {
        setData(response.data[0] as Sample);
      } else {
        setErrMsg(`Record ${seqId} could not be found within the context of ${selectedGroup!.name}`);
      }
    };
    if (selectedGroup && tokenLoading !== LoadingState.LOADING &&
      tokenLoading !== LoadingState.IDLE) {
      updateSampleData();
    }
  }, [token, tokenLoading, selectedGroup, seqId]);

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
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={errToast}
        autoHideDuration={6000}
        onClose={handleClose}
      >
        <Alert onClose={handleClose} severity="warning">
          The group
          {' '}
          {errorGroupName}
          {' '}
          is not available or does not exist
        </Alert>
      </Snackbar>
      <Typography className="pageTitle">
        {`${seqId} (${selectedGroup?.name} view)`}
      </Typography>
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
                setGroupName(selected.name);
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
      {errMsg ? <Alert severity="error">{errMsg}</Alert> : (
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
      )}
    </>
  );
}
export default SampleDetail;
