import React, {
  useEffect, useState,
} from 'react';
import { MRT_PaginationState, MRT_ColumnDef, MRT_SortingState } from 'material-react-table';
import { useParams } from 'react-router-dom';
import { Alert, Typography } from '@mui/material';
import {
  getSamples, getProjectDetails, getTotalSamples, ResponseObject, getDisplayFields, getPlots,
  getTrees,
} from '../../utilities/resourceUtils';
import { ProjectSample } from '../../types/sample.interface';
import { DisplayFields } from '../../types/fields.interface';
import { Filter } from '../Common/QueryBuilder';
// import Summary from './Summary';
import Samples from './Samples';
import TreeList from './TreeList';
import PlotList from './PlotList';
import CustomTabs, { TabPanel, TabContentProps } from '../Common/CustomTabs';
import { MetaDataColumn, PlotListing, Project } from '../../types/dtos';
import LoadingState from '../../constants/loadingState';
import ProjectDashboard from '../Dashboards/ProjectDashboard/ProjectDashboard';

const SAMPLE_ID_FIELD = 'Seq_ID';

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
  // const [lastUpload] = useState('');
  // Samples component states
  const [sampleTableColumns, setSampleTableColumns] = useState<MRT_ColumnDef[]>([]);
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [samplesPagination, setSamplesPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [columnOrderArray, setColumnOrderArray] = useState<string[]>([]);
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
  const [exportCSVStatus, setExportCSVStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [exportData, setExportData] = useState<ProjectSample[]>([]);
  // const [samplesErrorMessage, setSamplesErrorMessage] = useState('');
  // Trees component states
  const [isTreesLoading, setIsTreesLoading] = useState(true);
  const [projectTrees, setProjectTrees] = useState<[]>([]);
  const [treeListError, setTreeListError] = useState(false);
  const [treeListErrorMessage, setTreeListErrorMessage] = useState('');

  // Plots component states
  const [projectPlots, setProjectPlots] = useState<PlotListing[]>([]);
  const [isPlotsLoading, setIsPlotsLoading] = useState(true);

  useEffect(() => {
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
        setIsOverviewLoading(false);
      }
    }

    getProject();
  }, [projectAbbrev]);

  useEffect(() => {
    async function getProjectSummary() {
      const totalSamplesResponse: ResponseObject = await getTotalSamples(
        projectDetails!.projectMembers.id,
      );
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
      const tableHeadersResponse: ResponseObject = await getDisplayFields(
        projectDetails!.projectMembers.id,
      );
      if (tableHeadersResponse.status === 'Success') {
        const columnHeaderArray = tableHeadersResponse.data;
        const columnBuilder: React.SetStateAction<MRT_ColumnDef<{}>[]> = [];
        columnHeaderArray.forEach((element: MetaDataColumn) => {
          if (element.primitiveType === 'boolean') {
            columnBuilder.push({
              accessorKey: element.columnName,
              header: `${element.columnName}`,
              Cell: ({ cell }) => (cell.getValue() ? 'true' : 'false'),
            });
          
          }
          else if(element.columnName == 'Date_created' || element.columnName == 'Date_updated')
          {
            columnBuilder.push({
              accessorKey: element.columnName,
              header: `${element.columnName}`,
              Cell: ({cell}) => (new Date(String(cell.getValue())).toLocaleString()),
            });
          }
          else {
            columnBuilder.push({
              accessorKey: element.columnName,
              header: `${element.columnName}`,
            });
          }
        });
        setSampleTableColumns(columnBuilder);
        setIsSamplesError((prevState) => ({ ...prevState, samplesHeaderError: false }));
      } else {
        setIsSamplesLoading(false);
        setIsSamplesError((prevState) => ({
          ...prevState,
          samplesHeaderError: true,
          samplesErrorMessage: tableHeadersResponse.message,
        }));
        setSampleTableColumns([]);
      }
    }

    async function getTreeList() {
      const treeListResponse: ResponseObject = await getTrees(projectDetails!.projectId);
      if (treeListResponse.status === 'Success') {
        setProjectTrees(treeListResponse.data);
        setTreeListError(false);
        setIsTreesLoading(false);
      } else {
        setIsTreesLoading(false);
        setProjectTrees([]);
        setTreeListError(true);
        setTreeListErrorMessage(treeListResponse.message);
      }
    }

    async function getPlotList() {
      const plotsResponse: ResponseObject = await getPlots(projectDetails!.projectId);
      if (plotsResponse.status === 'Success') {
        setProjectPlots(plotsResponse.data as PlotListing[]);
        setIsPlotsLoading(false);
      } else {
        setIsPlotsLoading(false);
        setProjectPlots([]);
        // TODO set plots errors
      }
    }

    if (projectDetails) {
      getProjectSummary();
      getSampleTableHeaders();
      getTreeList();
      getPlotList();
    }
  }, [projectDetails]);

  useEffect(() => {
    async function getFilterFields() {
      if (sampleTableColumns.length > 0) {
        // TODO: Below should replace getSamples() call for getting table headers eventually
        // TODO: getFilterFields() and getSampleTableHeaders() should be combined
        const displayFieldsResponse: ResponseObject = await getDisplayFields(
          projectDetails!.projectMembers.id,
        );
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
  }, [projectDetails, sampleTableColumns]);

  useEffect(() => {
    const getColumnOrder = () => {
      function compareFields(field1: { columnOrder: number; }, field2: { columnOrder: number; }) {
        if (field1.columnOrder < field2.columnOrder) {
          return -1; // sort field1 before field2
        }
        if (field1.columnOrder > field2.columnOrder) {
          return 1; // sort field1 after field2
        }
        return 0; // keep original order of field1 and field2
      }
      const orderedArray: string[] = [];
      // 1. Order fields in an array from fieldList
      const copy = [...displayFields]; // Creating copy of original array so it's not overridden
      const sortedDisplayFields = copy.sort(compareFields);
      sortedDisplayFields.forEach((field) => {
        orderedArray.push(field.columnName);
      });
      // 2. Find additional fields - in sampleTableColumns but not sortedDisplayFields
      const additionalFields = sampleTableColumns.filter(
        (column: { header: string; }) => !sortedDisplayFields.some(
          (df) => df.columnName === column.header,
        ),
      );
      // 3. Append additional fields to end of array, excluding Seq_ID
      additionalFields
        .filter((field) => field.header !== SAMPLE_ID_FIELD)
        .forEach((field) => orderedArray.push(field.header));
      // 4. Append Seq_ID to beginning of array
      if (additionalFields.map((field) => field.header).includes(SAMPLE_ID_FIELD)) {
        orderedArray.unshift(SAMPLE_ID_FIELD);
      }
      // Done
      setColumnOrderArray(orderedArray);
    };
    if (displayFields.length > 0 && sampleTableColumns.length > 0) {
      getColumnOrder();
    }
  }, [displayFields, sampleTableColumns]);

  useEffect(
    () => {
    // Only get samples when columns are already populated
    // effects should trigger getProject -> getHeaders -> this function
      async function getSamplesList() {
        let sortString = '';
        if (sorting.length !== 0) {
          if (sorting[0].desc === false) {
            sortString = sorting[0].id;
          } else {
            sortString = `-${sorting[0].id}`;
          }
        }
        const searchParams = new URLSearchParams({
          Page: (samplesPagination.pageIndex + 1).toString(),
          PageSize: (samplesPagination.pageSize).toString(),
          groupContext: `${projectDetails!.projectMembers.id}`,
          filters: queryString,
          sorts: sortString,
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
    },
    [projectDetails, samplesPagination.pageIndex, samplesPagination.pageSize,
      sampleTableColumns, queryString, sorting],
  );

  const getExportData = async () => {
    setExportCSVStatus(LoadingState.LOADING);
    const searchParams = new URLSearchParams({
      Page: '1',
      PageSize: (totalSamples).toString(),
      groupContext: `${projectDetails!.projectMembers.id}`,
      filters: queryString,
    });
    const samplesResponse: ResponseObject = await getSamples(searchParams.toString());
    if (samplesResponse.status === 'Success') {
      setExportData(samplesResponse.data);
    } else {
      setExportCSVStatus(LoadingState.ERROR);
    }
  };
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
            {/* <Summary
              totalSamples={totalSamples}
              lastUpload={lastUpload}
              projectDesc={projectDetails ? projectDetails.description : ''}
            // isOverviewLoading={isOverviewLoading}
              isOverviewError={isOverviewError}
            /> */}
            <ProjectDashboard
              projectDesc={projectDetails ? projectDetails.description : ''}
              projectId={projectDetails ? projectDetails!.projectId : null}
              groupId={projectDetails ? projectDetails!.projectMembers.id : null}
              setFilterList={setFilterList}
              setTabValue={setTabValue}
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
              sorting={sorting}
              setSorting={setSorting}
              samplesPagination={samplesPagination}
              setSamplesPagination={setSamplesPagination}
              isFiltersOpen={isFiltersOpen}
              setIsFiltersOpen={setIsFiltersOpen}
              setQueryString={setQueryString}
              filterList={filterList}
              setFilterList={setFilterList}
              displayFields={displayFields}
              columnOrderArray={columnOrderArray}
              getExportData={getExportData}
              setExportData={setExportData}
              exportCSVStatus={exportCSVStatus}
              setExportCSVStatus={setExportCSVStatus}
              exportData={exportData}
            />
          </TabPanel>
          <TabPanel value={tabValue} index={2} tabLoader={isTreesLoading}>
            <TreeList
              isTreesLoading={isTreesLoading}
              projectAbbrev={projectAbbrev!}
              treeList={projectTrees}
              treeListError={treeListError}
              treeListErrorMessage={treeListErrorMessage}
            />
          </TabPanel>
          <TabPanel value={tabValue} index={3} tabLoader={isPlotsLoading}>
            <PlotList
              isPlotsLoading={isPlotsLoading}
              projectAbbrev={projectAbbrev!}
              plotList={projectPlots}
            />
          </TabPanel>
        </>
      )

  );
}
export default ProjectOverview;
