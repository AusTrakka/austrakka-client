import { Alert, Paper, type SelectChangeEvent, Stack, Typography } from '@mui/material';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import {
  DataTable,
  type DataTableFilterMeta,
  type DataTableFilterMetaData,
  type DataTableRowClickEvent,
} from 'primereact/datatable';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../../app/ApiContext';
import LoadingState from '../../constants/loadingState';
import { ResponseType } from '../../constants/responseType';
import type { Project } from '../../types/dtos';
import type { ResponseObject } from '../../types/responseObject.interface';
import { isoDateLocalDate } from '../../utilities/dateUtils';
import { getProjectList } from '../../utilities/resourceUtils';
import SearchInput from '../TableComponents/SearchInput';
import sortIcon from '../TableComponents/SortIcon';
import LabelFilterSelect from '../TableComponents/TypeFilterSelect';

const columns = [
  { field: 'abbreviation', header: 'Abbreviation' },
  { field: 'name', header: 'Name' },
  { field: 'label', header: 'Label' },
  { field: 'description', header: 'Description' },
  {
    field: 'created',
    header: 'Created',
    body: (rowData: any) => isoDateLocalDate(rowData.created),
  },
];

function ProjectsList() {
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedProject, setSelectedProject] = useState({});
  const [allLabels, setAllLabels] = useState<string[]>([]);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const navigate = useNavigate();
  const { token, tokenLoading } = useApi();
  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    label: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    async function getProjects() {
      const projectResponse: ResponseObject<Project[]> = await getProjectList(token);
      if (projectResponse.status === ResponseType.Success) {
        const filteredProjects = projectResponse.data?.filter(
          ({ clientType }) => !clientType || clientType === import.meta.env.VITE_BRANDING_ID,
        );
        setProjectsList(filteredProjects ?? []);
        setIsLoading(false);
        setIsError(false);
      } else {
        setIsError(true);
        setIsLoading(false);
        setProjectsList([]);
        setErrorMessage(projectResponse.message);
      }
    }
    // NEW: Only call endpoint if token has already been retrieved/attempted to be retrieved
    // Otherwise the first endpoint call will always be unsuccessful
    if (tokenLoading !== LoadingState.IDLE && tokenLoading !== LoadingState.LOADING) {
      getProjects();
    }
  }, [token, tokenLoading]);

  useEffect(() => {
    if (Object.keys(selectedProject).length !== 0) {
      const { abbreviation }: any = selectedProject;
      navigate(`/projects/${abbreviation}`);
    }
  }, [selectedProject, navigate]);

  const rowClickHandler = (row: DataTableRowClickEvent) => {
    const selectedProjectRow = row.data;
    setSelectedProject(selectedProjectRow);
  };

  useEffect(() => {
    const distinctLabels = [...new Set(projectsList.map((project: Project) => project.label))];
    setAllLabels(distinctLabels);
  }, [projectsList]);

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const filtersCopy = { ...filters };
    (filtersCopy.global as DataTableFilterMetaData).value = value;
    setFilters(filtersCopy);
  };

  const onLabelFilterChange = (e: SelectChangeEvent<string | null>) => {
    const { value } = e.target;
    setSelectedValue(value || null);
    const filtersCopy = { ...filters };
    (filtersCopy.label as DataTableFilterMetaData).value = value;
    setFilters(filtersCopy);
    if (value) {
      setSearchParams({ label: value });
    } else {
      setSearchParams({});
    }
  };

  const resetFilters = () => {
    const filtersCopy = { ...filters };
    (filtersCopy.global as DataTableFilterMetaData).value = null;
    (filtersCopy.label as DataTableFilterMetaData).value = null;
    setFilters(filtersCopy);
  };

  const onLabelFilterClear = () => {
    setSelectedValue(null);
    resetFilters();
    setSearchParams({});
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: prevent infinite loop
  useEffect(() => {
    if (allLabels.length > 0) {
      const labelFromUrl = searchParams.get('label');
      if (labelFromUrl) {
        const matchingLabel = allLabels.find(
          (label) => label && label.toLowerCase() === labelFromUrl.toLowerCase(),
        );
        if (matchingLabel) {
          setSelectedValue(matchingLabel);
          const filtersCopy = { ...filters };
          (filtersCopy.label as DataTableFilterMetaData).value = matchingLabel;
          setFilters(filtersCopy);
        } else {
          onLabelFilterClear();
        }
      }
    }
  }, [allLabels, searchParams]);

  const header = (
    <div
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}
    >
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
        <SearchInput
          value={(filters.global as DataTableFilterMetaData).value || ''}
          onChange={onGlobalFilterChange}
        />
        <LabelFilterSelect
          selectedValue={selectedValue}
          onLabelFilterChange={onLabelFilterChange}
          onLabelFilterClear={onLabelFilterClear}
          allLabels={allLabels}
        />
      </Stack>
    </div>
  );

  return isError ? (
    <Alert severity="error">{errorMessage}</Alert>
  ) : (
    <>
      <Typography className="pageTitle">Projects</Typography>
      <Paper elevation={2} sx={{ marginBottom: 10 }}>
        <DataTable
          value={projectsList}
          className="my-flexible-table"
          resizableColumns
          reorderableColumns
          sortIcon={sortIcon}
          sortField="created" // Initial sort order
          sortOrder={-1}
          filters={filters}
          globalFilterFields={columns.map((col) => col.field)}
          size="small"
          removableSort
          scrollable
          rows={25}
          scrollHeight="calc(100vh - 300px)"
          onRowClick={rowClickHandler}
          selectionMode="single"
          paginator
          paginatorRight
          showGridlines
          header={header}
          loading={isLoading}
          rowsPerPageOptions={[25, 50, 100, 500]}
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink JumpToPageDropDown"
          currentPageReportTemplate=" Viewing: {first} to {last} of {totalRecords}"
        >
          {columns.map((col: any) => (
            <Column
              key={col.field}
              field={col.field}
              header={col.header}
              body={col.body}
              sortable
              className="flexible-column"
              headerClassName="custom-title"
              bodyClassName="value-cells"
            />
          ))}
        </DataTable>
      </Paper>
    </>
  );
}
export default ProjectsList;
