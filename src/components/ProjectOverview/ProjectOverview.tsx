import React, {
  useEffect, useState,
} from 'react';
import { MRT_PaginationState, MRT_ColumnDef } from 'material-react-table';
import {
  getSamples, getProjectDetails, getTotalSamples, ResponseObject, getDisplayFields,
} from '../../utilities/resourceUtils';
import { ProjectSample } from '../../types/sample.interface';
import { DisplayFields } from '../../types/fields.interface';
import { Filter } from '../Common/QueryBuilder';
import Summary from './Summary';
import Samples from './Samples';
import TreeList from './TreeList';
import Plots from './Plots';
import CustomTabs, { TabPanel, TabContentProps } from '../Common/CustomTabs';

function ProjectOverview() {
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
  const [projectDetails, setProjectDetails] = useState({ description: '' });
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
  // const [samplesErrorMessage, setSamplesErrorMessage] = useState('');
  const [isTreesLoading] = useState(true);
  const [isPlotsLoading] = useState(true);

  async function getProject() {
    // TODO: Get project details (/api/Projects/id) based on project id rather than session storage
    const projectResponse: ResponseObject = await getProjectDetails();
    if (projectResponse.status === 'Success') {
      setProjectDetails(projectResponse.data);
      setIsOverviewError((prevState) => ({ ...prevState, detailsError: false }));
    } else {
      setIsOverviewError((prevState) => ({
        ...prevState,
        detailsError: true,
        detailsErrorMessage: projectResponse.message,
      }));
    }
    const totalSamplesResponse: ResponseObject = await getTotalSamples();
    if (totalSamplesResponse.status === 'Success') {
      const count: string = totalSamplesResponse.headers?.get('X-Total-Count')!;
      setTotalSamples(+count);
      setIsOverviewError((prevState) => ({ ...prevState, totalSamplesError: false }));
    } else {
      setIsOverviewError((prevState) => ({
        ...prevState,
        totalSamplesError: true,
        totalSamplesErrorMessage: projectResponse.message,
      }));
    }
    setIsOverviewLoading(false);
    // TODO: Define new endpoint that provides the latest upload date from backend
  }

  async function getSampleTableHeaders() {
    setIsSamplesLoading(true);
    // Using a intermediate endpoint for the time being until a "get columns" endpoint is defined
    const samplesResponse: ResponseObject = await getSamples(`groupContext=${sessionStorage.getItem('selectedProjectMemberGroupId')}`);
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
    getProject(); // API calls
    getSampleTableHeaders();
  }, []);

  useEffect(() => {
    async function getFilterFields() {
      if (sampleTableColumns.length > 0) {
        // TODO: Below should replace getSamples() call for getting table headers eventually
        const displayFieldsResponse: ResponseObject = await getDisplayFields();
        // Intermediate solution:
        // Filtering displayField response to capture only values that are in the table
        const res = displayFieldsResponse.data.filter(
          (df: { columnName: string; }) => sampleTableColumns.some(
            (column) => column.header === df.columnName,
          ),
        );
        // Alphabetically order the fields
        res.sort(
          (a: any, b: any) => a.columnName.localeCompare(b.columnName),
        );
        setDisplayFields(res);
      }
    }
    getFilterFields();
  }, [sampleTableColumns]);

  useEffect(() => {
    // Only get samples when columns are already populated
    async function getSamplesList() {
      const searchParams = new URLSearchParams({
        Page: (samplesPagination.pageIndex + 1).toString(),
        PageSize: (samplesPagination.pageSize).toString(),
        groupContext: `${sessionStorage.getItem('selectedProjectMemberGroupId')}`,
        filters: queryString,
      });
      const samplesResponse: ResponseObject = await getSamples(searchParams.toString());
      if (samplesResponse.status === 'Success') {
        setProjectSamples(samplesResponse.data);
        setIsSamplesError((prevState) => ({ ...prevState, sampleMetadataError: false }));
        setIsSamplesLoading(false);
        const count: string = samplesResponse.headers?.get('X-Total-Count')!;
        setSamplesCount(+count);
        //   setIsOverviewError((prevState) => ({ ...prevState, totalSamplesError: false }));
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
  }, [samplesPagination.pageIndex, samplesPagination.pageSize, sampleTableColumns, queryString]);
  // TODO: Move export to CSV logic here
  //
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
          projectDesc={projectDetails.description}
          // isOverviewLoading={isOverviewLoading}
          isOverviewError={isOverviewError}
        />
      </TabPanel>
      <TabPanel value={tabValue} index={1} tabLoader={isSamplesLoading}>
        <Samples
          totalSamples={totalSamples}
          samplesCount={samplesCount}
          sampleList={projectSamples}
          isSamplesLoading={isSamplesLoading}
          sampleTableColumns={sampleTableColumns}
          isSamplesError={isSamplesError}
          samplesPagination={samplesPagination}
          setSamplesPagination={setSamplesPagination}
          isFiltersOpen={isFiltersOpen}
          setIsFiltersOpen={setIsFiltersOpen}
          queryString={queryString}
          setQueryString={setQueryString}
          filterList={filterList}
          setFilterList={setFilterList}
          displayFields={displayFields}
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
