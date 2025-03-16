import React, {
  useEffect, useMemo, useState,
} from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Typography } from '@mui/material';
// import Summary from './Summary';
import Samples from './Samples';
import TreeList from './TreeList';
import PlotList from './PlotList';
import Datasets from '../ProjectDatasets/Datasets';
import CustomTabs, { TabPanel, TabContentProps } from '../Common/CustomTabs';
import { Project } from '../../types/dtos';
import ProjectDashboard from '../Dashboards/ProjectDashboard/ProjectDashboard';
import {
  selectAwaitingProjectMetadata,
  selectProjectMergeAlgorithm,
} from '../../app/projectMetadataSlice';
import { useAppSelector } from '../../app/store';
import { PROJECT_OVERVIEW_TABS } from './projTabConstants';

function ProjectOverview() {
  const { tab } = useParams();
  const [tabValue, setTabValue] = useState(0);

  const [projectDetails, setProjectDetails] = useState<Project | null>(null);

  // Project Overview component states
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);
  const [isOverviewError, setIsOverviewError] = useState({
    detailsError: false,
    detailsErrorMessage: '',
    totalSamplesError: false,
    totalSamplesErrorMessage: '',
    latestDateError: true,
    latestDateErrorMessage: `There was an error, please report this to the ${import.meta.env.VITE_BRANDING_NAME} team.`,
  });
  // const [lastUpload] = useState('');

  // Tab loading states
  const isSamplesLoading : boolean = useAppSelector((state) =>
    selectAwaitingProjectMetadata(state, projectDetails?.abbreviation));
  const mergeAlgorithm = useAppSelector((state) =>
    selectProjectMergeAlgorithm(state, projectDetails?.abbreviation));
  const [isTreesLoading, setIsTreesLoading] = useState(true);
  const [isPlotsLoading, setIsPlotsLoading] = useState(true);
  
  useEffect(() => {
    // Static project details for now
    setProjectDetails({
      projectId: 1,
      globalId: 'project-id',
      abbreviation: 'local',
      name: 'Local',
      description: 'Local data',
      type: 'Local',
      projectMembers: {
        id: 1,
        name: 'Local-Group',
      },
      projectAnalyses: [],
      created: new Date(),
    });
  }, []);

  useEffect(() => {
    // This currently provides total sample count to both Summary(dashboard) and Samples tabs
    // Could replace with a function that counts groupMetadata.metadata.length
    // TODO
    // async function getProjectSummary() {
    //   const totalSamplesResponse: ResponseObject = await getTotalSamples(
    //     projectDetails!.projectMembers.id,
    //     token,
    //   );
    //   if (totalSamplesResponse.status === ResponseType.Success) {
    //     setIsOverviewError((prevState) => ({ ...prevState, totalSamplesError: false }));
    //   } else {
    //     setIsOverviewError((prevState) => ({
    //       ...prevState,
    //       totalSamplesError: true,
    //       totalSamplesErrorMessage: totalSamplesResponse.message,
    //     }));
    //   }
    //   setIsOverviewLoading(false);
    //   // TODO: Make use of latest upload date from project views
    // }
    //
    // if (projectDetails &&
    //   tokenLoading !== LoadingState.IDLE &&
    //   tokenLoading !== LoadingState.LOADING
    // ) {
    //   getProjectSummary();
    // }
  }, [projectDetails]);

  const projectOverviewTabs: TabContentProps[] = useMemo(() => PROJECT_OVERVIEW_TABS, []);

  useEffect(() => {
    const initialTabValue = projectOverviewTabs
      .findIndex((t) => tab === t.title.toLowerCase());
    if (initialTabValue !== -1) {
      setTabValue(initialTabValue);
    }
  }, [tab, projectOverviewTabs]);

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
          <CustomTabs value={tabValue} tabContent={projectOverviewTabs} setValue={setTabValue} />
          <TabPanel value={tabValue} index={0} tabLoader={isOverviewLoading}>
            <ProjectDashboard
              projectDesc={projectDetails ? projectDetails.description : ''}
              projectAbbrev="local"
            />
          </TabPanel>
          <TabPanel value={tabValue} index={1} tabLoader={isSamplesLoading}>
            <Samples
              projectAbbrev="local"
              isSamplesLoading={isSamplesLoading}
            />
          </TabPanel>
          <TabPanel value={tabValue} index={2} tabLoader={isTreesLoading}>
            <TreeList
              projectDetails={projectDetails}
              isTreesLoading={isTreesLoading}
              setIsTreesLoading={setIsTreesLoading}
            />
          </TabPanel>
          <TabPanel value={tabValue} index={3} tabLoader={isPlotsLoading}>
            <PlotList
              projectDetails={projectDetails}
              isPlotsLoading={isPlotsLoading}
              setIsPlotsLoading={setIsPlotsLoading}
            />
          </TabPanel>
          <TabPanel value={tabValue} index={6} tabLoader={false}>
            <Datasets projectDetails={projectDetails} mergeAlgorithm={mergeAlgorithm} />
          </TabPanel>
        </>
      )

  );
}
export default ProjectOverview;
