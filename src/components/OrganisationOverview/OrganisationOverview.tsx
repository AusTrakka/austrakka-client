import React, { memo, useEffect, useState } from 'react';
import { Box, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { MRT_ColumnDef, MRT_PaginationState, MRT_SortingState } from 'material-react-table';
import { ResponseObject, getDisplayFields, getGroupList } from '../../utilities/resourceUtils';
import OrganisationSamples from './OrganisationSamples';
import Samples from '../ProjectOverview/Samples';
import LoadingState from '../../constants/loadingState';
import { DisplayFields } from '../../types/fields.interface';
import { Filter } from '../Common/QueryBuilder';
import { ProjectSample } from '../../types/sample.interface';
import { MetaDataColumn } from '../../types/dtos';
import isoDateLocalDate, { isoDateLocalDateNoTime } from '../../utilities/helperUtils';

function OrgGroupSelector(props: any) {
  const { selectedGroup, setSelectedGroup, groups } = props;

  return (
    <FormControl variant="standard" sx={{ marginX: 1, marginTop: 1, minWidth: 220 }}>
      <InputLabel id="org-select-label">Organisation group</InputLabel>
      <Select
        labelId="org-select-label"
        id="org-select"
        value={selectedGroup}
        onChange={(e) => setSelectedGroup(e.target.value)}
        label="Organisation group"
        autoWidth
      >
        { groups.map((group: any) => (
          <MenuItem
            value={group}
            key={group.name}
          >
            {group.name}
          </MenuItem>
        )) }
        { groups.length === 0 ? (
          <MenuItem disabled>No owner groups available</MenuItem>
        ) : null}
      </Select>
    </FormControl>
  );
}

function OrganisationOverview() {
  const [selectedGroup, setSelectedGroup] = useState('');
  const [groups, setGroups] = useState([]);

  // Below is a cut and paste from ProjectOverview.tsx
  const [sampleTableColumns, setSampleTableColumns] = useState<MRT_ColumnDef[]>([]);
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [samplesPagination, setSamplesPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [columnOrderArray, setColumnOrderArray] = useState<string[]>([]);
  const [isSamplesLoading, setIsSamplesLoading] = useState(false);
  const [projectSamples, setProjectSamples] = useState<ProjectSample[]>([]);
  const [totalSamples, setTotalSamples] = useState(0);
  const [samplesCount, setSamplesCount] = useState(0);
  const [isSamplesError, setIsSamplesError] = useState({
    samplesHeaderError: false,
    sampleMetadataError: false,
    samplesErrorMessage: '',
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [queryString, setQueryString] = useState('');
  const [filterList, setFilterList] = useState<Filter[]>([]);
  const [displayFields, setDisplayFields] = useState<DisplayFields[]>([]);
  const [exportCSVStatus, setExportCSVStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [exportData, setExportData] = useState<ProjectSample[]>([]);
  ///

  async function getGroups() {
    const groupResponse: ResponseObject = await getGroupList();
    if (groupResponse.status === 'Success') {
      // Filter out only owner groups
      const ownerGroups = groupResponse.data.filter((group: any) => group.name.includes('-Owner'));
      setGroups(ownerGroups);
      if (ownerGroups.length) {
        setSelectedGroup(ownerGroups[0]);
      }
    } else {
      // TODO: Set error message here - endpoint error message
      console.log(groupResponse);
    }
  }

  useEffect(() => {
    getGroups();
  }, []);
  useEffect(() => {
    // 1: GET TABLE HEADERS & FILTER FIELDS - can be custom hook
    // 2: GET COLUMN ORDER - an be custom hook
    // 3: GET SAMPLES
    // 4: GET EXPORT DATA

  }, [selectedGroup]);

  const getExportData = async () => {
  };

  return (
    <Box>
      <Grid container direction="row" spacing={2}>
        <Grid container item xs={12} justifyContent="space-between">
          <Typography variant="h2" color="primary">Organisation Overview</Typography>
          <OrgGroupSelector
            groups={groups}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
          />
        </Grid>
      </Grid>
      <Samples
        totalSamples={totalSamples}
        samplesCount={samplesCount}
        sampleList={projectSamples}
        isSamplesLoading={isSamplesLoading}
        sampleTableColumns={sampleTableColumns}
        isSamplesError={isSamplesError}
        sorting={sorting}
        setSorting={setSorting}
        samplesPagination={samplesPagination}
        setSamplesPagination={setSamplesPagination}
        isFiltersOpen={isFiltersOpen}
        setIsFiltersOpen={setIsFiltersOpen}
        setQueryString={setQueryString}
        filterList={filterList}
        setFilterList={setFilterList}
        displayFields={displayFields}
        columnOrderArray={columnOrderArray}
        getExportData={getExportData}
        setExportData={setExportData}
        exportCSVStatus={exportCSVStatus}
        setExportCSVStatus={setExportCSVStatus}
        exportData={exportData}
      />
    </Box>
  );
}
export default memo(OrganisationOverview);
