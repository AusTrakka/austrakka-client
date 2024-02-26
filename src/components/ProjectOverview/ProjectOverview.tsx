import React, {
  useEffect, useMemo, useState,
} from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Alert, Typography } from '@mui/material';
import {
  getProjectDetails, getTotalSamples,
} from '../../utilities/resourceUtils';
// import Summary from './Summary';
import Samples from './Samples';
import TreeList from './TreeList';
import PlotList from './PlotList';
import MemberList from './MemberList';
import Datasets from '../ProjectDatasets/Datasets';
import CustomTabs, { TabPanel, TabContentProps } from '../Common/CustomTabs';
import { Project } from '../../types/dtos';
import LoadingState from '../../constants/loadingState';
import ProjectDashboard from '../Dashboards/ProjectDashboard/ProjectDashboard';
import ProFormas from './ProFormas';
import { useApi } from '../../app/ApiContext';
import {
  fetchProjectMetadata,
  selectAwaitingProjectMetadata,
} from '../../app/projectMetadataSlice';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { ResponseObject } from '../../types/responseObject.interface';
import { ResponseType } from '../../constants/responseType';
import { DataFilter } from '../DataFilters/DataFilters';

function ProjectOverview() {
  const { projectAbbrev } = useParams();
  const { token, tokenLoading } = useApi();
  const [tabValue, setTabValue] = useState(0);
  const location = useLocation();
  const pathName = location.pathname;

  const [projectDetails, setProjectDetails] = useState<Project | null>(null);

  // Project Overview component states
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);
  const [isOverviewError, setIsOverviewError] = useState({
    detailsError: false,
    detailsErrorMessage: '',
    totalSamplesError: false,
    totalSamplesErrorMessage: '',
    latestDateError: true,
    latestDateErrorMessage: 'There was an error, please report this to an AusTrakka admin.',
  });
  // const [lastUpload] = useState('');

  // Samples component states
  const [totalSamples, setTotalSamples] = useState(0);
  const [sampleFilters, setSampleFilters] = useState<DataFilter[]>([]);

  // Tab loading states
  const isSamplesLoading : boolean = useAppSelector((state) =>
    selectAwaitingProjectMetadata(state, projectDetails?.abbreviation));
  const [isTreesLoading, setIsTreesLoading] = useState(true);
  const [isPlotsLoading, setIsPlotsLoading] = useState(true);
  const [isMembersLoading, setIsMembersLoading] = useState(true);
  const [isProformasLoading, setIsProformasLoading] = useState(true);

  const dispatch = useAppDispatch();

  useEffect(() => {
    async function getProject() {
      const projectResponse: ResponseObject = await getProjectDetails(projectAbbrev!, token);
      if (projectResponse.status === ResponseType.Success) {
        setProjectDetails(projectResponse.data as Project);
        setIsOverviewError((prevState) => ({ ...prevState, detailsError: false }));
      } else {
        setIsOverviewError((prevState) => ({
          ...prevState,
          detailsError: true,
          detailsErrorMessage: projectResponse.message,
        }));
        setIsOverviewLoading(false);
      }
    }
    if (tokenLoading !== LoadingState.IDLE && tokenLoading !== LoadingState.LOADING) {
      getProject();
    }
  }, [projectAbbrev, token, tokenLoading]);

  useEffect(() => {
    // This currently provides total sample count to both Summary(dashboard) and Samples tabs
    // Could replace with a function that counts groupMetadata.metadata.length
    async function getProjectSummary() {
      const totalSamplesResponse: ResponseObject = await getTotalSamples(
        projectDetails!.projectMembers.id,
        token,
      );
      if (totalSamplesResponse.status === ResponseType.Success) {
        const count: string = totalSamplesResponse.headers?.get('X-Total-Count')!;
        setTotalSamples(+count);
        setIsOverviewError((prevState) => ({ ...prevState, totalSamplesError: false }));
      } else {
        setIsOverviewError((prevState) => ({
          ...prevState,
          totalSamplesError: true,
          totalSamplesErrorMessage: totalSamplesResponse.message,
        }));
      }
      setIsOverviewLoading(false);
      // TODO: Make use of latest upload date from project views
    }

    if (projectDetails &&
      tokenLoading !== LoadingState.IDLE &&
      tokenLoading !== LoadingState.LOADING
    ) {
      getProjectSummary();
      dispatch(fetchProjectMetadata({ projectAbbrev: projectDetails.abbreviation, token }));
    }
  }, [projectDetails, token, tokenLoading, dispatch]);

  const projectOverviewTabs: TabContentProps[] = useMemo(() => [
    {
      index: 0,
      title: 'Summary',
    },
    {
      index: 1,
      title: 'Samples',
    },
    {
      index: 2,
      title: 'Trees',
    },
    {
      index: 3,
      title: 'Plots',
    },
    {
      index: 4,
      title: 'Members',
    },
    {
      index: 5,
      title: 'Proformas',
    },
    {
      index: 6,
      title: 'Datasets',
    },
  ], []);

  useEffect(() => {
    const initialTabValue = projectOverviewTabs
      .findIndex((tab) => pathName.endsWith(tab.title.toLowerCase()));
    if (initialTabValue !== -1) {
      setTabValue(initialTabValue);
    }
  }, [pathName, projectOverviewTabs]);

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
          <CustomTabs value={tabValue} setValue={setTabValue} tabContent={projectOverviewTabs} />
          <TabPanel value={tabValue} index={0} tabLoader={isOverviewLoading}>
            <ProjectDashboard
              projectDesc={projectDetails ? projectDetails.description : ''}
              projectId={projectDetails ? projectDetails!.projectId : null}
              groupId={projectDetails ? projectDetails!.projectMembers.id : null}
              setFilterList={setSampleFilters}
              setTabValue={setTabValue}
            />
          </TabPanel>
          <TabPanel value={tabValue} index={1} tabLoader={isSamplesLoading}>
            <Samples
              projectAbbrev={projectAbbrev!}
              totalSamples={totalSamples}
              isSamplesLoading={isSamplesLoading}
              inputFilters={sampleFilters}
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
          <TabPanel value={tabValue} index={4} tabLoader={isMembersLoading}>
            <MemberList
              projectDetails={projectDetails}
              isMembersLoading={isMembersLoading}
              setIsMembersLoading={setIsMembersLoading}
            />
          </TabPanel>
          <TabPanel value={tabValue} index={5} tabLoader={isProformasLoading}>
            <ProFormas
              projectDetails={projectDetails}
              isProformasLoading={isProformasLoading}
              setIsProformasLoading={setIsProformasLoading}
            />
          </TabPanel>
          <TabPanel value={tabValue} index={6} tabLoader={false}>
            <Datasets projectDetails={projectDetails} />
          </TabPanel>
        </>
      )

  );
}
export default ProjectOverview;
