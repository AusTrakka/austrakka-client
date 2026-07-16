import { Settings } from '@mui/icons-material';
import { Alert, Button, Chip, IconButton, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useApi } from '../../app/ApiContext';
import { NavigationProvider, useStableNavigate } from '../../app/NavigationContext';
import {
  fetchProjectMetadata,
  selectProjectMergeAlgorithm,
  selectProjectStaleDataAvailable, // NEW
} from '../../app/projectMetadataSlice';
import { useAppDispatch, useAppSelector } from '../../app/store';
import LoadingState from '../../constants/loadingState';
import ProjectStatus from '../../constants/projectStatus';
import { ResponseType } from '../../constants/responseType';
import type { Project } from '../../types/dtos';
import { getProjectDetails } from '../../utilities/resourceUtils';
import Activity from '../Common/Activity/Activity';
import CustomTabs from '../Common/CustomTabs';
import TabPanel from '../Common/TabPanel';
import ProjectDashboardDetails from '../Dashboards/ProjectDashboard/ProjectDashboard';
import Datasets from '../ProjectDatasets/Datasets';
import ProjectDocuments from '../ProjectDocuments/ProjectDocuments';
import MemberList from './MemberList';
import PlotList from './PlotList';
import ProFormas from './ProFormas';
import style from './ProjectOverview.module.css';
import ProjectSamplesTable from './ProjectSamplesTable';
import { PROJ_HOME_TAB, PROJ_TABS } from './projTabConstants';
import TreeList from './TreeList';

interface ProjectOverviewProps {
  tab: string;
  projectAbbrev: string;
}

const initialTabLoadStates: Record<number, boolean> = Object.values(PROJ_TABS).reduce(
  (acc, t) => {
    acc[t.index] = true;
    return acc;
  },
  {} as Record<number, boolean>,
);

function ProjectOverview(props: ProjectOverviewProps) {
  const { projectAbbrev, tab } = props;
  const { token, tokenLoading } = useApi();
  const { navigate } = useStableNavigate();
  const location = useLocation();
  const [tabValue, setTabValue] = useState<number | null>(null);
  const [tabLoadStates, setTabLoadStates] = useState<Record<number, boolean>>(initialTabLoadStates);

  const tabLoadingSetters = useMemo(
    () =>
      Object.values(PROJ_TABS).reduce(
        (acc, pt) => {
          acc[pt.index] = (loading: boolean | ((prev: boolean) => boolean)) =>
            setTabLoadStates((prev) => ({
              ...prev,
              [pt.index]: typeof loading === 'function' ? loading(prev[pt.index]) : loading,
            }));
          return acc;
        },
        {} as Record<number, React.Dispatch<React.SetStateAction<boolean>>>,
      ),
    [],
  );

  const [projectDetails, setProjectDetails] = useState<Project | null>(null);
  const [isOverviewError, setIsOverviewError] = useState({
    detailsError: false,
    detailsErrorMessage: '',
  });

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

  const mergeAlgorithm = useAppSelector((state) =>
    selectProjectMergeAlgorithm(state, projectDetails?.abbreviation),
  );

  const staleDataAvailable = useAppSelector((state) =>
    selectProjectStaleDataAvailable(state, projectDetails?.abbreviation),
  );

  const handleRefresh = () => {
    if (!projectDetails?.abbreviation || !token) return;
    dispatch(fetchProjectMetadata({ projectAbbrev: projectDetails.abbreviation, token }));
  };

  const navigateToSettings = () => {
    navigate(`/projects/${projectAbbrev}/settings`);
  };

  const getProjectStatusStyle = (status: ProjectStatus) => {
    let statusStyle = style.projectStatus;

    switch (status) {
      case ProjectStatus.CLOSED:
        statusStyle = style.statusClosed;
        break;
      case ProjectStatus.OPEN:
        statusStyle = style.statusOpen;
        break;
      default:
        break;
    }

    return statusStyle;
  };

  useEffect(() => {
    const tabKey = tab.toLowerCase();
    const tabObj = PROJ_TABS[tabKey];
    if (tabObj) {
      setTabValue(tabObj.index);
    }
  }, [tab]);

  if (tabValue === null) {
    return null;
  }

  return isOverviewError.detailsError ? (
    <Alert severity="error">{isOverviewError.detailsErrorMessage}</Alert>
  ) : (
    <>
      <Typography
        className="pageTitle"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {projectDetails ? projectDetails.name : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
          <Chip
            className={getProjectStatusStyle(projectDetails?.status as ProjectStatus)}
            label={`status: ${projectDetails?.status}`}
          />
          <IconButton aria-label="settings" onClick={() => navigateToSettings()}>
            <Settings fontSize="small" />
          </IconButton>
        </div>
      </Typography>
      {staleDataAvailable && (
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Refresh
            </Button>
          }
          sx={{ mb: 1 }}
        >
          Newer data is available for this project.
        </Alert>
      )}

      <CustomTabs value={tabValue} tabContent={Object.values(PROJ_TABS)} setValue={setTabValue} />
      <TabPanel value={tabValue} index={PROJ_TABS.dashboard.index}>
        <ProjectDashboardDetails
          projectDesc={projectDetails ? projectDetails.description : ''}
          projectAbbrev={projectAbbrev!}
        />
      </TabPanel>
      <TabPanel value={tabValue} index={PROJ_TABS.samples.index}>
        <ProjectSamplesTable key={location.search} projectAbbrev={projectAbbrev!} />
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
      <TabPanel value={tabValue} index={PROJ_TABS.datasets.index}>
        <Datasets projectDetails={projectDetails} mergeAlgorithm={mergeAlgorithm} />
      </TabPanel>
      <TabPanel value={tabValue} index={PROJ_TABS.activity.index}>
        <Activity recordType="Project" rGuid={projectDetails?.globalId ?? ''} />
      </TabPanel>
      <TabPanel value={tabValue} index={PROJ_TABS.documents.index}>
        <ProjectDocuments projectDetails={projectDetails} />
      </TabPanel>
    </>
  );
}

function ProjectOverviewWrapper() {
  const { projectAbbrev, tab } = useParams();
  if (!projectAbbrev) return null;
  let resolvedTab: string = tab ?? PROJ_HOME_TAB;
  const allowedKeys: string[] = Object.keys(PROJ_TABS) as Array<string>;
  if (!allowedKeys.includes(resolvedTab)) {
    window.history.replaceState(null, '', `/projects/${projectAbbrev}`);
    resolvedTab = PROJ_HOME_TAB;
  }
  return (
    <NavigationProvider>
      <ProjectOverview projectAbbrev={projectAbbrev} tab={resolvedTab} />
    </NavigationProvider>
  );
}

export default ProjectOverviewWrapper;
