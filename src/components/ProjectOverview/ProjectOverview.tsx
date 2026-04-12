import { Alert, Typography } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { selectAwaitingProjectMetadata } from '../../app/projectMetadataSlice';
import { useAppSelector } from '../../app/store';
import { LOCAL_PROJECT } from '../../constants/standaloneClientConstants';
import CustomTabs, { type TabContentProps } from '../Common/CustomTabs';
import TabPanel from '../Common/TabPanel';
import PlotList from './PlotList';
import ProjectSamplesTable from './ProjectSamplesTable';
import { PROJ_TABS, PROJ_TABS_LIST } from './projTabConstants';
import TreeList from './TreeList';

function ProjectOverview() {
  const { tab } = useParams();
  const [tabValue, setTabValue] = useState<number | null>(0);
  
  // Tab loading states
  const isSamplesLoading: boolean = useAppSelector((state) =>
    selectAwaitingProjectMetadata(state, LOCAL_PROJECT.abbreviation),
  );

  const projectOverviewTabs: TabContentProps[] = useMemo(() => PROJ_TABS_LIST, []);

  useEffect(() => {
    const initialTabValue = projectOverviewTabs.findIndex((t) => tab === t.title.toLowerCase());
    if (initialTabValue !== -1) {
      setTabValue(initialTabValue);
    } else {
      setTabValue(0);
    }
  }, [tab, projectOverviewTabs]);

  return isSamplesLoading ? (
    <Alert severity="error">Add data to visualise!</Alert>
  ) : (
    <>
      <CustomTabs value={tabValue!} tabContent={Object.values(PROJ_TABS)} setValue={setTabValue} />
      <TabPanel value={tabValue!} index={PROJ_TABS.samples.index}>
        <ProjectSamplesTable projectAbbrev={LOCAL_PROJECT.abbreviation} />
      </TabPanel>
      <TabPanel value={tabValue!} index={PROJ_TABS.trees.index}>
        <TreeList />
      </TabPanel>
      <TabPanel value={tabValue!} index={PROJ_TABS.plots.index}>
        <PlotList projectDetails={LOCAL_PROJECT} />
      </TabPanel>
    </>
  );
}
export default ProjectOverview;
