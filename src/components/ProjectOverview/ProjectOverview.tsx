import React, {
  useEffect, useMemo, useState,
} from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Typography } from '@mui/material';
// import Summary from './Summary';
import Samples from './Samples';
import TreeList from './TreeList';
import PlotList from './PlotList';
import CustomTabs, { TabPanel, TabContentProps } from '../Common/CustomTabs';
import ProjectDashboard from '../Dashboards/ProjectDashboard/ProjectDashboard';
import {
  selectAwaitingProjectMetadata,
} from '../../app/projectMetadataSlice';
import { useAppSelector } from '../../app/store';
import { PROJECT_OVERVIEW_TABS } from './projTabConstants';
import { LOCAL_PROJECT } from '../../constants/standaloneClientConstants';

function ProjectOverview() {
  const { tab } = useParams();
  const [tabValue, setTabValue] = useState(0);

  const projectDetails = LOCAL_PROJECT;

  // Tab loading states
  const isSamplesLoading : boolean = useAppSelector((state) =>
    selectAwaitingProjectMetadata(state, projectDetails?.abbreviation));

  const projectOverviewTabs: TabContentProps[] = useMemo(() => PROJECT_OVERVIEW_TABS, []);

  useEffect(() => {
    const initialTabValue = projectOverviewTabs
      .findIndex((t) => tab === t.title.toLowerCase());
    if (initialTabValue !== -1) {
      setTabValue(initialTabValue);
    }
  }, [tab, projectOverviewTabs]);

  return (
    isSamplesLoading
      ? (
        <Alert severity="error">
          Add data to visualise!
        </Alert>
      )
      : (
        <>
          <Typography className="pageTitle">
            {/* {projectDetails ? projectDetails.name : ''} */}
          </Typography>
          <CustomTabs value={tabValue} tabContent={projectOverviewTabs} setValue={setTabValue} />
          <TabPanel value={tabValue} index={0} tabLoader={isSamplesLoading}>
            <ProjectDashboard
              projectDesc={projectDetails ? projectDetails.description : ''}
              projectAbbrev="local"
            />
          </TabPanel>
          <TabPanel value={tabValue} index={1} tabLoader={isSamplesLoading}>
            <Samples
              projectAbbrev={LOCAL_PROJECT.abbreviation}
              isSamplesLoading={isSamplesLoading}
            />
          </TabPanel>
          <TabPanel value={tabValue} index={2} tabLoader={false}>
            <TreeList />
          </TabPanel>
          <TabPanel value={tabValue} index={3} tabLoader={false}>
            <PlotList
              projectDetails={projectDetails}
            />
          </TabPanel>
        </>
      )

  );
}
export default ProjectOverview;
