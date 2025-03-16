import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Paper,
  SelectChangeEvent,
  Stack,
  Typography,
} from '@mui/material';
import { DataTable,
  DataTableFilterMeta,
  DataTableFilterMetaData,
  DataTableRowClickEvent } from 'primereact/datatable';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import sortIcon from '../TableComponents/SortIcon';
import SearchInput from '../TableComponents/SearchInput';
import { isoDateLocalDate } from '../../utilities/dateUtils';
import TypeFilterSelect from '../TableComponents/TypeFilterSelect';

//* * will not be used for now **//
// function renderTagChip(cell: string): JSX.Element {
//   const tag = cell;
//   if (cell === null || cell === undefined || cell === '') {
//     return (
//       <Typography
//         variant="body2"
//         color="textDisabled"
//         sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}
//       >
//         No Type Set
//       </Typography>
//     );
//   }
//   return (
//     <Chip
//       key={tag}
//       label={tag}
//       variant="outlined"
//       size="small"
//       style={{ margin: '3px',
//         display: 'flex',
//         justifyContent: 'center',
//         color: 'var(--secondary-dark-green)',
//         width: '100%',
//         borderRadius: '0px' }}
//     />
//   );
// }

const columns = [
  { field: 'abbreviation', header: 'Abbreviation' },
  { field: 'name', header: 'Name' },
  { field: 'type', header: 'Type' },
  { field: 'description', header: 'Description' },
  { field: 'created', header: 'Created', body: (rowData: any) => isoDateLocalDate(rowData.created) },
];

function ProjectsList() {
  const [projectsList, setProjectsList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedProject, setSelectedProject] = useState({});
  const [allTypes, setAllTypes] = useState<string[]>([]);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const navigate = useNavigate();
  const [filters, setFilters] = useState<DataTableFilterMeta>(
    {
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      type: { value: null, matchMode: FilterMatchMode.CONTAINS },
    },
  );

  useEffect(() => {
    // For now, set to a single local "project" TODO change this
    setProjectsList([{
      abbreviation: 'local',
      name: 'Local',
      type: 'Local',
      description: 'Local data',
      created: new Date(),
    }]);
  }, []);

  useEffect(() => {
    if (Object.keys(selectedProject).length !== 0) {
      const { abbreviation }: any = selectedProject;
      navigate(`/projects/${abbreviation}/summary`);
    }
  }, [selectedProject, navigate]);

  const rowClickHandler = (row: DataTableRowClickEvent) => {
    const selectedProjectRow = row.data;
    setSelectedProject(selectedProjectRow);
  };
  
  useEffect(() => {
    const distinctTypes = [...new Set(projectsList.map((project: any) => project.type))];
    setAllTypes(distinctTypes);
  }, [projectsList]);

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const filtersCopy = { ...filters };
    (filtersCopy.global as DataTableFilterMetaData).value = value;
    setFilters(filtersCopy);
  };
  
  const onTypeFilterChange = (e : SelectChangeEvent<string | null>) => {
    const { value } = e.target;
    setSelectedValue(value || null);
    const filtersCopy = { ...filters };
    (filtersCopy.type as DataTableFilterMetaData).value = value;
    setFilters(filtersCopy);
  };
  
  const resetFilters = () => {
    const filtersCopy = { ...filters };
    (filtersCopy.global as DataTableFilterMetaData).value = null;
    (filtersCopy.type as DataTableFilterMetaData).value = null;
    setFilters(filtersCopy);
  };
  
  const onTypeFilterClear = () => {
    setSelectedValue(null);
    resetFilters();
  };

  const header = (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
        <SearchInput
          value={(filters.global as DataTableFilterMetaData).value || ''}
          onChange={onGlobalFilterChange}
        />
        <TypeFilterSelect
          selectedValue={selectedValue}
          onTypeFilterChange={onTypeFilterChange}
          onTypeFilterClear={onTypeFilterClear}
          allTypes={allTypes}
        />
      </Stack>
    </div>
  );

  return (
    (isError) ? (
      <Alert severity="error">
        {errorMessage}
      </Alert>
    )
      : (
        <>
          <Typography className="pageTitle">
            Projects
          </Typography>
          <Paper elevation={2} sx={{ marginBottom: 10 }}>
            <DataTable
              value={projectsList}
              className="my-flexible-table"
              resizableColumns
              reorderableColumns
              sortIcon={sortIcon}
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
      )
  );
}
export default ProjectsList;
