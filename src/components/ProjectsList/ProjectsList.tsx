import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table';
import { isoDateLocalDate } from '../../utilities/helperUtils';
import { getProjectList, ResponseObject } from '../../utilities/resourceUtils';

function ProjectsList() {
  const [projectsList, setProjectsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [selectedProject, setSelectedProject] = useState({});
  const navigate = useNavigate();

  const columns:MRT_ColumnDef[] = [
    { header: 'Abbreviation', accessorKey: 'abbreviation' },
    { header: 'Name', accessorKey: 'name' },
    { header: 'Description', accessorKey: 'description' },
    { header: 'Created', accessorKey: 'created', Cell: ({ cell }) => <div>{isoDateLocalDate(cell)}</div> },
  ];

  useEffect(() => {
    getProject();
  }, []);

  useEffect(() => {
    if (Object.keys(selectedProject).length !== 0) {
      const { projectMembers, name, projectId }: any = selectedProject;
      sessionStorage.setItem('selectedProjectMemberGroupId', projectMembers.id);
      sessionStorage.setItem('selectedProjectName', name);
      sessionStorage.setItem('selectedProjectId', projectId);
      navigate('/projects/details');
    }
  }, [selectedProject]);

  async function getProject() {
    const projectResponse: ResponseObject = await getProjectList();
    if (projectResponse.status == 'success') {
      setProjectsList([]); // setProjectsList(response.data)
      setIsLoading(false);
    } else {
      setIsError(true);
      setIsLoading(false);
    }
  }

  const rowClickHandler = (row: any) => {
    const selectedProject = row.original;
    setSelectedProject(selectedProject);
  };

  return (
    <MaterialReactTable
      columns={columns}
      data={projectsList}
      enableStickyHeader
      initialState={{ density: 'compact' }}
      enableColumnResizing
      enableFullScreenToggle={false}
      enableHiding={false}
      enableDensityToggle={false}
      state={{
        isLoading,
        showAlertBanner: isError,
      }}
      muiToolbarAlertBannerProps={
          isError
            ? {
              color: 'error',
              children: 'Error loading data',
            }
            : undefined
        }
      muiLinearProgressProps={({ isTopToolbar }) => ({
        color: 'secondary',
        sx: { display: isTopToolbar ? 'block' : 'none' },
      })}
        // Layout props
      muiTableProps={{
        sx: {
          width: 'auto', tableLayout: 'auto', '& td:last-child': { width: '100%' }, '& th:last-child': { width: '100%' },
        },
      }}
        // Row click handler
      muiTableBodyRowProps={({ row }) => ({
        onClick: () => rowClickHandler(row),
      })}
    />
  );
}
export default ProjectsList;
