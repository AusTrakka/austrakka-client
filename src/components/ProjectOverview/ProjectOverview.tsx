import React, {
  useEffect, useMemo, useState,
} from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Typography } from '@mui/material';
import { NavigationProvider } from '../../app/NavigationContext';
import { getProjectDetails } from '../../utilities/resourceUtils';
import ProjectSamplesTable from './ProjectSamplesTable';
import TreeList from './TreeList';
import PlotList from './PlotList';
import MemberList from './MemberList';
import Datasets from '../ProjectDatasets/Datasets';
import CustomTabs from '../Common/CustomTabs';
import TabPanel from '../Common/TabPanel';
import { Project } from '../../types/dtos';
import LoadingState from '../../constants/loadingState';
import ProjectDashboard from '../Dashboards/ProjectDashboard/ProjectDashboard';
import ProFormas from './ProFormas';
import { useApi } from '../../app/ApiContext';
import {
  fetchProjectMetadata, selectAwaitingPartialProjectMetadata,
  selectProjectMergeAlgorithm,
} from '../../app/projectMetadataSlice';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { ResponseType } from '../../constants/responseType';
import { PROJ_HOME_TAB, PROJ_TABS } from './projTabConstants';

interface ProjectOverviewProps {
  tab: string,
  projectAbbrev: string,
}

const initialTabLoadStates: Record<number, boolean> = Object.values(PROJ_TABS).reduce(
  (acc, t) => {
    acc[t.index] = true; // loading by default
    return acc;
  },
  {} as Record<number, boolean>,
);

function ProjectOverview(props: ProjectOverviewProps) {
  const { projectAbbrev, tab } = props;
  const { token, tokenLoading } = useApi();
  
  const [tabValue, setTabValue] = useState<number | null>(null);

  const [tabLoadStates, setTabLoadStates] = useState(initialTabLoadStates);

  const tabLoadingSetters = useMemo(() => (
    Object.values(PROJ_TABS).reduce((acc, pt) => {
      acc[pt.index] = (loading: boolean) =>
        setTabLoadStates(prev => ({ ...prev, [pt.index]: loading }));
      return acc;
    }, {} as Record<number, (loading: boolean) => void>)
  ), []);
  
  const [projectDetails, setProjectDetails] = useState<Project | null>(null);

  // Project Overview component states
  const [isOverviewError, setIsOverviewError] = useState({
    detailsError: false,
    detailsErrorMessage: '',
  });

  // Tab loading states
 
  const dispatch = useAppDispatch();

  useEffect(() => {
    async function getProject() {
      const projectResponse = await getProjectDetails(projectAbbrev!, token);
      if (projectResponse.status === ResponseType.Success) {
        setProjectDetails(projectResponse.data!);
        dispatch(
          fetchProjectMetadata({ projectAbbrev: projectResponse.data!.abbreviation, token }),
        );
        setIsOverviewError((prevState) => ({ ...prevState, detailsError: false }));
      } else {
        setIsOverviewError((prevState) => ({
          ...prevState,
          detailsError: true,
          detailsErrorMessage: projectResponse.message,
        }));
      }
    }
    if (tokenLoading !== LoadingState.IDLE && tokenLoading !== LoadingState.LOADING) {
      getProject();
    }
  }, [dispatch, projectAbbrev, token, tokenLoading]);

  const isSamplesLoading : boolean = useAppSelector((state) =>
    selectAwaitingPartialProjectMetadata(state, projectDetails?.abbreviation));
  const mergeAlgorithm = useAppSelector((state) =>
    selectProjectMergeAlgorithm(state, projectDetails?.abbreviation));

  useEffect(() => {
    const tabKey = tab.toLowerCase(); // e.g. "plots"
    const tabObj = PROJ_TABS[tabKey];

    if (tabObj) {
      setTabValue(tabObj.index);
    }
  }, [tab]);
  
  if (tabValue === null) { return null; }

  return (
    isOverviewError.detailsError
      ? (
        <Alert severity="error">
          {isOverviewError.detailsErrorMessage}
        </Alert>
      )
      : (
        <>
          <Typography className="pageTitle">
            {projectDetails ? projectDetails.name : ''}
          </Typography>
          <CustomTabs
            value={tabValue}
            tabContent={Object.values(PROJ_TABS)}
            setValue={setTabValue}
          />
          <TabPanel
            value={tabValue}
            index={PROJ_TABS.dashboard.index}
          >
            <ProjectDashboard
              projectDesc={projectDetails ? projectDetails.description : ''}
              projectAbbrev={projectAbbrev!}
            />
          </TabPanel>

          <TabPanel
            value={tabValue}
            index={PROJ_TABS.samples.index}
          >
            <ProjectSamplesTable
              projectAbbrev={projectAbbrev!}
              isSamplesLoading={isSamplesLoading}
            />
          </TabPanel>
          <TabPanel
            value={tabValue}
            index={PROJ_TABS.trees.index}
            loadingState={tabLoadStates[PROJ_TABS.trees.index]}
            setIsLoading={tabLoadingSetters[PROJ_TABS.trees.index]}
          >
            <TreeList
              projectDetails={projectDetails}
              setIsLoading={tabLoadingSetters[PROJ_TABS.trees.index]}
            />
          </TabPanel>
          <TabPanel
            value={tabValue}
            index={PROJ_TABS.plots.index}
            loadingState={tabLoadStates[PROJ_TABS.plots.index]}
            setIsLoading={tabLoadingSetters[PROJ_TABS.plots.index]}
          >
            <PlotList
              projectDetails={projectDetails}
              setIsLoading={tabLoadingSetters[PROJ_TABS.plots.index]}
            />
          </TabPanel>
          <TabPanel
            value={tabValue}
            index={PROJ_TABS.members.index}
            loadingState={tabLoadStates[PROJ_TABS.members.index]}
            setIsLoading={tabLoadingSetters[PROJ_TABS.members.index]}
          >
            <MemberList
              projectDetails={projectDetails}
              setIsLoading={tabLoadingSetters[PROJ_TABS.members.index]}
            />
          </TabPanel>
          <TabPanel
            value={tabValue}
            index={PROJ_TABS.proformas.index}
            loadingState={tabLoadStates[PROJ_TABS.proformas.index]}
            setIsLoading={tabLoadingSetters[PROJ_TABS.proformas.index]}
          >
            <ProFormas
              projectDetails={projectDetails}
              setIsLoading={tabLoadingSetters[PROJ_TABS.proformas.index]}
            />
          </TabPanel>
          <TabPanel
            value={tabValue}
            index={PROJ_TABS.datasets.index}
          >
            <Datasets
              projectDetails={projectDetails}
              mergeAlgorithm={mergeAlgorithm}
            />
          </TabPanel>
        </>
      )
  );
}

function ProjectOverviewWrapper() {
  const { projectAbbrev, tab } = useParams();
  if (!projectAbbrev) return null;
  return (
    <NavigationProvider>
      <ProjectOverview projectAbbrev={projectAbbrev} tab={tab ?? PROJ_HOME_TAB} />
    </NavigationProvider>
  );
}
export default ProjectOverviewWrapper;
