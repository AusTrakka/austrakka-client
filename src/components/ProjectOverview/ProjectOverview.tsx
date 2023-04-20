import React, {
  useEffect, useState,
} from 'react';
import { MRT_PaginationState, MRT_ColumnDef } from 'material-react-table';
import {
  ResponseObject, getSamples, getProjectDetails, getPlots, getTotalSamples
} from '../../utilities/resourceUtils';
import { ProjectSample } from '../../types/sample.interface';
import Summary from './Summary';
import Samples from './Samples';
import TreeList from './TreeList';
import PlotList from './PlotList';
import CustomTabs, { TabPanel, TabContentProps } from '../Common/CustomTabs';
import { useParams } from 'react-router-dom';
import { PlotListing, Project } from '../../types/dtos';

function ProjectOverview() {
  const { projectAbbrev } = useParams();
  const [tabValue, setTabValue] = useState(0);
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
  const [projectDetails, setProjectDetails] = useState<Project | null>(null);
  const [lastUpload] = useState('');
  // Samples component states
  const [sampleTableColumns, setSampleTableColumns] = useState<MRT_ColumnDef[]>([]);
  const [samplesPagination, setSamplesPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [isSamplesLoading, setIsSamplesLoading] = useState(false);
  const [projectSamples, setProjectSamples] = useState<ProjectSample[]>([]);
  const [totalSamples, setTotalSamples] = useState(0);
  const [isSamplesError, setIsSamplesError] = useState({
    samplesHeaderError: false,
    sampleMetadataError: false,
    samplesErrorMessage: '',
  });
  // const [samplesErrorMessage, setSamplesErrorMessage] = useState('');
  // Trees component states
  const [isTreesLoading] = useState(true);
  // Plots component states
  const [projectPlots, setProjectPlots] = useState<PlotListing[]>([])
  const [isPlotsLoading, setIsPlotsLoading] = useState(true);

  async function getProject() {
    const projectResponse: ResponseObject = await getProjectDetails(projectAbbrev!);
    if (projectResponse.status === 'Success') {
      setProjectDetails(projectResponse.data as Project);
      setIsOverviewError((prevState) => ({ ...prevState, detailsError: false }));
    } else {
      setIsOverviewError((prevState) => ({
        ...prevState,
        detailsError: true,
        detailsErrorMessage: projectResponse.message,
      }));
    }
  }

  async function getProjectSummary() {
    const totalSamplesResponse: ResponseObject = await getTotalSamples(projectDetails!.projectMembers.id);
    if (totalSamplesResponse.status === 'Success') {
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
    // TODO: Define new endpoint that provides the latest upload date from backend
  }

  async function getSampleTableHeaders() {
    setIsSamplesLoading(true);
    // Using a intermediate endpoint for the time being until a "get columns" endpoint is defined
    // TODO should just get the first row of data?
    const samplesResponse: ResponseObject = await getSamples(`groupContext=${projectDetails!.projectMembers.id}`);
    if (samplesResponse.status === 'Success') {
      if (samplesResponse.data.length > 1) {
        const columnHeaderArray = Object.keys(samplesResponse.data[0]);
        const columnBuilder: React.SetStateAction<MRT_ColumnDef<{}>[]> = [];
        columnHeaderArray.forEach((element) => {
          columnBuilder.push({ accessorKey: element, header: element });
        });
        setSampleTableColumns(columnBuilder);
        setIsSamplesError((prevState) => ({ ...prevState, samplesHeaderError: false }));
      } else {
        setIsSamplesLoading(false);
        setIsSamplesError((prevState) => ({
          ...prevState,
          samplesHeaderError: true,
          samplesErrorMessage: samplesResponse.message,
        }));
        setSampleTableColumns([]);
      }
    } else {
      setIsSamplesLoading(false);
      setIsSamplesError((prevState) => ({
        ...prevState,
        samplesHeaderError: true,
        samplesErrorMessage: samplesResponse.message,
      }));
      setSampleTableColumns([]);
    }
  }

  useEffect(() => {
    getProject(); 
  }, []);

  useEffect(() => {
    if (projectDetails){ 
      getSampleTableHeaders();
    }
  }, [projectDetails])

  useEffect(() => {
    if (projectDetails){
      getPlotList();
    }
  }, [projectDetails])

  useEffect(() => {
    if (projectDetails){
      getProjectSummary()
    }
  }, [projectDetails])

  useEffect(() => {
    // Only get samples when columns are already populated
    // effects should trigger getProject -> getHeaders -> this function
    async function getSamplesList() {
      const searchParams = new URLSearchParams({
        Page: (samplesPagination.pageIndex + 1).toString(),
        PageSize: (samplesPagination.pageSize).toString(),
        groupContext: `${projectDetails!.projectMembers.id}`,
      });
      const samplesResponse: ResponseObject = await getSamples(searchParams.toString());
      if (samplesResponse.status === 'Success') {
        setProjectSamples(samplesResponse.data);
        setIsSamplesError((prevState) => ({ ...prevState, sampleMetadataError: false }));
        setIsSamplesLoading(false);
      } else {
        setIsSamplesLoading(false);
        setIsSamplesError((prevState) => ({
          ...prevState,
          sampleMetadataError: true,
          samplesErrorMessage: samplesResponse.message,
        }));
        setProjectSamples([]);
      }
    }
    if (sampleTableColumns.length > 0) {
      getSamplesList();
    } else {
      setProjectSamples([]);
    }
  }, [samplesPagination.pageIndex, samplesPagination.pageSize, sampleTableColumns]);

  async function getPlotList() {
    const plotsResponse: ResponseObject = await getPlots(projectDetails!.projectId);
    if (plotsResponse.status === 'Success'){
      setProjectPlots(plotsResponse.data as PlotListing[])
      setIsPlotsLoading(false)
    } else {
      setIsPlotsLoading(false)
      setProjectPlots([])
      // TODO set plots errors
    }
  }

  const projectOverviewTabs: TabContentProps[] = [
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
  ];

  return (
    <>
      <CustomTabs value={tabValue} setValue={setTabValue} tabContent={projectOverviewTabs} />
      <TabPanel value={tabValue} index={0} tabLoader={isOverviewLoading}>
        <Summary
          totalSamples={totalSamples}
          lastUpload={lastUpload}
          projectDesc={projectDetails ? projectDetails.description : ''}
          // isOverviewLoading={isOverviewLoading}
          isOverviewError={isOverviewError}
        />
      </TabPanel>
      <TabPanel value={tabValue} index={1} tabLoader={isSamplesLoading}>
        <Samples
          totalSamples={totalSamples}
          sampleList={projectSamples}
          isSamplesLoading={isSamplesLoading}
          sampleTableColumns={sampleTableColumns}
          isSamplesError={isSamplesError}
          samplesPagination={samplesPagination}
          setSamplesPagination={setSamplesPagination}
        />
      </TabPanel>
      <TabPanel value={tabValue} index={2} tabLoader={isTreesLoading}>
        <TreeList isTreesLoading={isTreesLoading} />
      </TabPanel>
      <TabPanel value={tabValue} index={3} tabLoader={isPlotsLoading}>
        <PlotList isPlotsLoading={isPlotsLoading} projectAbbrev={projectAbbrev!} plotList={projectPlots} />
      </TabPanel>
    </>
  );
}
export default ProjectOverview;
