import React, {
  useEffect, useMemo, useState,
} from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Typography } from '@mui/material';
import ProjectSamplesTable from './ProjectSamplesTable';
import TreeList from './TreeList';
import PlotList from './PlotList';
import TabPanel from '../Common/TabPanel';
import CustomTabs, { TabContentProps } from '../Common/CustomTabs';
import {
  selectAwaitingProjectMetadata,
} from '../../app/projectMetadataSlice';
import { useAppSelector } from '../../app/store';
import { PROJ_TABS, PROJ_TABS_LIST } from './projTabConstants';
import { LOCAL_PROJECT } from '../../constants/standaloneClientConstants';

function ProjectOverview() {
  const { tab } = useParams();
  const [tabValue, setTabValue] = useState<number | null>(0);

  const projectDetails = LOCAL_PROJECT;

  // Tab loading states
  const isSamplesLoading : boolean = useAppSelector((state) =>
    selectAwaitingProjectMetadata(state, projectDetails?.abbreviation));

  const projectOverviewTabs: TabContentProps[] = useMemo(() => PROJ_TABS_LIST, []);

  useEffect(() => {
    const initialTabValue = projectOverviewTabs
      .findIndex((t) => tab === t.title.toLowerCase());
    if (initialTabValue !== -1) {
      setTabValue(initialTabValue);
    } else {
      setTabValue(0);
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
          <CustomTabs value={tabValue!} tabContent={Object.values(PROJ_TABS)} setValue={setTabValue} />
          <TabPanel value={tabValue!} index={PROJ_TABS.samples.index}>
            <ProjectSamplesTable
              projectAbbrev={LOCAL_PROJECT.abbreviation}
            />
          </TabPanel>
          <TabPanel value={tabValue!} index={PROJ_TABS.trees.index}>
            <TreeList />
          </TabPanel>
          <TabPanel value={tabValue!} index={PROJ_TABS.plots.index}>
            <PlotList
              projectDetails={projectDetails}
            />
          </TabPanel>
        </>
      )

  );
}
export default ProjectOverview;
