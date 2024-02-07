import React, {
  useEffect, useMemo, useState,
} from 'react';
import { MRT_PaginationState, MRT_ColumnDef, MRT_SortingState } from 'material-react-table';
import { useLocation, useParams } from 'react-router-dom';
import { Alert, Typography } from '@mui/material';
import {
  getSamples, getProjectDetails, getTotalSamples, getDisplayFields, getPlots,
  getTrees, getGroupMembers, getGroupProFormaVersions,
} from '../../utilities/resourceUtils';
import { ProjectSample } from '../../types/sample.interface';
import { Filter } from '../Common/QueryBuilder';
// import Summary from './Summary';
import Samples from './Samples';
import TreeList from './TreeList';
import PlotList from './PlotList';
import MemberList from './MemberList';
import CustomTabs, { TabPanel, TabContentProps } from '../Common/CustomTabs';
import { MetaDataColumn, PlotListing, Project, Member, ProFormaVersion } from '../../types/dtos';
import LoadingState from '../../constants/loadingState';
import ProjectDashboard from '../Dashboards/ProjectDashboard/ProjectDashboard';
import isoDateLocalDate, { isoDateLocalDateNoTime } from '../../utilities/helperUtils';
import ProFormas from './ProFormas';
import { SAMPLE_ID_FIELD } from '../../constants/metadataConsts';
import { useApi } from '../../app/ApiContext';
import {
  fetchGroupMetadata,
} from '../../app/metadataSlice';
import { useAppDispatch } from '../../app/store';
import { ResponseObject } from '../../types/responseObject.interface';
import { ResponseType } from '../../constants/responseType';

function ProjectOverview() {
  const { projectAbbrev } = useParams();
  const { token, tokenLoading } = useApi();
  const [tabValue, setTabValue] = useState(0);
  const location = useLocation();
  const pathName = location.pathname;
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
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [queryString, setQueryString] = useState('');
  const [filterList, setFilterList] = useState<Filter[]>([]);
  const [displayFields, setDisplayFields] = useState<MetaDataColumn[]>([]);
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

  // Members component states
  const [projectMembers, setProjectMembers] = useState<Member[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(true);
  const [memberListError, setMemberListError] = useState(false);
  const [memberListErrorMessage, setMemberListErrorMessage] = useState('');

  // ProFormas component states
  const [projectProFormas, setProjectProFormas] = useState<ProFormaVersion[]>([]);
  const [isProFormasLoading, setIsProFormasLoading] = useState(true);
  const [proFormasError, setProFormaError] = useState(false);
  const [proFromasErrorMessage, setProFormasErrorMessage] = useState('');

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
    // Maps from a hard-coded metadata field name to a function to render the cell value
    const sampleRenderFunctions : { [index: string]: Function } = {
      'Shared_groups': (value: any) => value.toString().replace(/[[\]"']/g, ''),
    };
    // Fields which should be rendered as datetimes, not just dates
    // This hard-coding is interim until the server is able to provide this information
    const datetimeFields = new Set(['Date_created', 'Date_updated']);

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
      // TODO: Define new endpoint that provides the latest upload date from backend
    }

    async function getSampleTableHeaders() {
      setIsSamplesLoading(true);
      const tableHeadersResponse: ResponseObject = await getDisplayFields(
        projectDetails!.projectMembers.id,
        token,
      );
      if (tableHeadersResponse.status === ResponseType.Success) {
        const columnHeaderArray = tableHeadersResponse.data;
        const columnBuilder: React.SetStateAction<MRT_ColumnDef<{}>[]> = [];
        // we need to catch that in the occation where there are no headers.
        if (columnHeaderArray.length === 0) {
          setIsSamplesLoading(false);
        } else {
          columnHeaderArray.forEach((element: MetaDataColumn) => {
            if (element.columnName in sampleRenderFunctions) {
              columnBuilder.push({
                accessorKey: element.columnName,
                header: `${element.columnName}`,
                Cell: ({ cell }) => sampleRenderFunctions[element.columnName](cell.getValue()),
              });
            } else if (element.primitiveType === 'boolean') {
              columnBuilder.push({
                accessorKey: element.columnName,
                header: `${element.columnName}`,
                Cell: ({ cell }) => (cell.getValue() ? 'true' : 'false'),
              });
            } else if (element.primitiveType === 'date') {
              columnBuilder.push({
                accessorKey: element.columnName,
                header: `${element.columnName}`,
                Cell: ({ cell }: any) => (
                  datetimeFields.has(element.columnName)
                    ? isoDateLocalDate(cell.getValue())
                    : isoDateLocalDateNoTime(cell.getValue())),
              });
            } else {
              columnBuilder.push({
                accessorKey: element.columnName,
                header: `${element.columnName}`,
              });
            }
          });
          setSampleTableColumns(columnBuilder);
          setIsSamplesError((prevState) => ({ ...prevState, samplesHeaderError: false }));
        }
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
      const treeListResponse: ResponseObject = await getTrees(projectDetails!.abbreviation, token);
      if (treeListResponse.status === ResponseType.Success) {
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
      const plotsResponse: ResponseObject = await getPlots(projectDetails!.projectId, token);
      if (plotsResponse.status === ResponseType.Success) {
        setProjectPlots(plotsResponse.data as PlotListing[]);
        setIsPlotsLoading(false);
      } else {
        setIsPlotsLoading(false);
        setProjectPlots([]);
        // TODO set plots errors
      }
    }

    async function getMemberList() {
      // eslint-disable-next-line max-len
      const memberListResponse : ResponseObject = await getGroupMembers(projectDetails!.projectMembers.id, token);
      if (memberListResponse.status === ResponseType.Success) {
        setProjectMembers(memberListResponse.data as Member[]);
        setMemberListError(false);
        setIsMembersLoading(false);
      } else {
        setIsMembersLoading(false);
        setProjectMembers([]);
        setMemberListError(true);
        setMemberListErrorMessage(memberListResponse.message);
      }
    }

    async function getProFormaList() {
      const proformaListResponse : ResponseObject =
        await getGroupProFormaVersions(projectDetails!.projectMembers.id, token);
      if (proformaListResponse.status === ResponseType.Success) {
        const data = proformaListResponse.data as ProFormaVersion[];
        setProjectProFormas(data);
        setIsProFormasLoading(false);
      } else {
        setIsProFormasLoading(false);
        setProjectProFormas([]);
        setProFormaError(true);
        setProFormasErrorMessage(proformaListResponse.message);
      }
    }

    if (projectDetails) {
      getProjectSummary();
      getSampleTableHeaders();
      getTreeList();
      getPlotList();
      getMemberList();
      getProFormaList();
      dispatch(fetchGroupMetadata({ groupId: projectDetails.projectMembers.id, token }));
    }
  }, [projectDetails, token, dispatch]);

  useEffect(() => {
    async function getFilterFields() {
      if (sampleTableColumns.length > 0) {
        // TODO: Below should replace getSamples() call for getting table headers eventually
        // TODO: getFilterFields() and getSampleTableHeaders() should be combined
        const displayFieldsResponse: ResponseObject = await getDisplayFields(
          projectDetails!.projectMembers.id,
          token,
        );
        // Intermediate solution:
        // Filtering displayField response to capture only values that are in the table
        const res = displayFieldsResponse.data.filter(
          (df: { columnName: string; }) => sampleTableColumns.some(
            (column) => column.header === df.columnName,
          ),
        );
        // TODO: Remove below as this happens within QueryBUilder now
        // Alphabetically order the fields
        res.sort(
          (a: any, b: any) => a.columnName.localeCompare(b.columnName),
        );
        setDisplayFields(res);
      }
    }

    getFilterFields();
  }, [projectDetails, sampleTableColumns, token]);

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
    // {HOWEVER IF THERE ARE no headers then the samples should stop loading}
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
          filters: queryString,
          sorts: sortString,
        });
        const samplesResponse: ResponseObject =
          await getSamples(token, projectDetails!.projectMembers.id, searchParams);
        if (samplesResponse.status === ResponseType.Success) {
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
      sampleTableColumns, queryString, sorting, token],
  );

  const getExportData = async () => {
    setExportCSVStatus(LoadingState.LOADING);
    const searchParams = new URLSearchParams({
      Page: '1',
      PageSize: (totalSamples).toString(),
      filters: queryString,
    });
    const samplesResponse: ResponseObject =
      await getSamples(token, projectDetails!.projectMembers.id, searchParams);
    if (samplesResponse.status === ResponseType.Success) {
      setExportData(samplesResponse.data);
    } else {
      setExportCSVStatus(LoadingState.ERROR);
    }
  };
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
              projectAbbrev={projectAbbrev!}
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
          <TabPanel value={tabValue} index={4} tabLoader={isMembersLoading}>
            <MemberList
              isMembersLoading={isMembersLoading}
              memberList={projectMembers}
              memberListError={memberListError}
              memberListErrorMessage={memberListErrorMessage}
              projectAbbrev={projectAbbrev!}
            />
          </TabPanel>
          <TabPanel value={tabValue} index={5} tabLoader={isProFormasLoading}>
            <ProFormas
              proformaList={projectProFormas}
              proformaError={proFormasError}
              proFormaErrorMessage={proFromasErrorMessage}
            />
          </TabPanel>
        </>
      )

  );
}
export default ProjectOverview;
