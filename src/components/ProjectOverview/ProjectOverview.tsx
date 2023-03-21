import React, {
  createRef, useEffect, useMemo, useState,
} from 'react';
import { MRT_PaginationState, MRT_ColumnDef } from 'material-react-table';
import {
  getSamples, getProjectDetails, getTotalSamples, ResponseObject,
} from '../../utilities/resourceUtils';
import { ProjectSample } from '../../types/sample.interface';
import Summary from './Summary';
import Samples from './Samples';
import TreeList from './TreeList';
import Plots from './Plots';
import CustomTabs, { TabPanel, TabContentProps } from '../Common/CustomTabs';

function ProjectOverview() {
  const [tabValue, setTabValue] = useState(0);
  // Project Overview component states
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);
  const [isOverviewError, setIsOverviewError] = useState(false);
  const [projectDetails, setProjectDetails] = useState({ description: '' });
  const [lastUpload, setlastUpload] = useState('');
  // Samples component states
  const [sampleTableColumns, setSampleTableColumns] = useState<MRT_ColumnDef[]>([]);
  const [samplesPagination, setSamplesPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [isSamplesLoading, setIsSamplesLoading] = useState(false);
  const [projectSamples, setProjectSamples] = useState<ProjectSample[]>([]);
  const [totalSamples, setTotalSamples] = useState(0);
  const [isSamplesError, setIsSamplesError] = useState(false);

  const [isTreesLoading, setIsTreesLoading] = useState(true);
  const [isPlotsLoading, setIsPlotsLoading] = useState(true);

  useEffect(() => {
    getProject(); // API calls
    getSampleTableHeaders();
  }, []);

  useEffect(() => {
    // Only get samples when columns are already populated
    if (sampleTableColumns.length > 0) {
      setIsSamplesLoading(true);
      getSamplesList();
    }
  }, [samplesPagination.pageIndex, samplesPagination.pageSize, sampleTableColumns]);

  async function getProject() {
    // TODO: Get project details (/api/Projects/id) based on project id rather than session storage
    const projectResponse: ResponseObject = await getProjectDetails();
    if (projectResponse.status == 'success') {
      setProjectDetails(projectResponse.data);
    } else {
      setIsOverviewError(true);
    }
    const totalSamplesResponse: ResponseObject = await getTotalSamples();
    if (totalSamplesResponse.status == 'success') {
      const count: string = totalSamplesResponse.headers.get('X-Total-Count')!;
      setTotalSamples(parseInt(count));
    } else {
      setIsOverviewError(true);
    }
    setIsOverviewLoading(false);
    // TODO: Define new endpoint that provides the latest upload date from backend
  }

  async function getSamplesList() {
    const searchParams = new URLSearchParams({
      Page: (samplesPagination.pageIndex + 1).toString(),
      PageSize: (samplesPagination.pageSize).toString(),
      groupContext: `${sessionStorage.getItem('selectedProjectMemberGroupId')}`,
    });
    const samplesResponse: ResponseObject = await getSamples(searchParams.toString());
    if (samplesResponse.status == 'success') {
      setProjectSamples(samplesResponse.data);
      setIsSamplesLoading(false);
    } else {
      setIsSamplesLoading(false);
      setIsSamplesError(true);
    }
  }
  async function getSampleTableHeaders() {
    // Using a intermediate endpoint for the time being until a "get columns" endpoint is defined
    const samplesResponse: ResponseObject = await getSamples(`groupContext=${sessionStorage.getItem('selectedProjectMemberGroupId')}`);
    if (samplesResponse.status == 'success') {
      if (samplesResponse.data.length > 1) {
        const columnHeaderArray = Object.keys(samplesResponse.data[0]);
        const columnBuilder: React.SetStateAction<MRT_ColumnDef<{}>[]> | { accessorKey: string; header: string; }[] = [];
        columnHeaderArray.forEach((element) => {
          columnBuilder.push({ accessorKey: element, header: element });
        });
        setSampleTableColumns(columnBuilder);
        setIsSamplesLoading(false);
      } else {
        setIsSamplesLoading(false);
        setIsSamplesError(true);
      }
    } else {
      setIsSamplesLoading(false);
      setIsSamplesError(true);
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
        <Summary totalSamples={totalSamples} lastUpload={lastUpload} projectDesc={projectDetails.description} isOverviewLoading={isOverviewLoading} isOverviewError={isOverviewError} />
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
        <Plots isPlotsLoading={isPlotsLoading} />
      </TabPanel>
    </>
  );
}
export default ProjectOverview;
