import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table';
import { Typography } from '@mui/material';
import isoDateLocalDate from '../../utilities/helperUtils';
import { getProjectList, ResponseObject } from '../../utilities/resourceUtils';

type Project = {
  abbreviation: string,
  name: string,
  description: string,
  created: string
};

const columns:MRT_ColumnDef<Project>[] = [
  { header: 'Abbreviation', accessorKey: 'abbreviation' },
  { header: 'Name', accessorKey: 'name' },
  { header: 'Description', accessorKey: 'description' },
  { header: 'Created', accessorKey: 'created', Cell: ({ cell }: any) => <>{isoDateLocalDate(cell)}</> },
];

function ProjectsList() {
  const [projectsList, setProjectsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedProject, setSelectedProject] = useState({});
  const navigate = useNavigate();

  async function getProject() {
    const projectResponse: ResponseObject = await getProjectList();
    if (projectResponse.status === 'Success') {
      setProjectsList(projectResponse.data);
      setIsLoading(false);
      setIsError(false);
    } else {
      setIsError(true);
      setIsLoading(false);
      setProjectsList([]);
      setErrorMessage(projectResponse.message);
    }
  }

  useEffect(() => {
    getProject();
  }, []);

  useEffect(() => {
    if (Object.keys(selectedProject).length !== 0) {
      const { abbreviation }: any = selectedProject;
      navigate(`/projects/${abbreviation}`);
    }
  }, [selectedProject, navigate]);

  const rowClickHandler = (row: any) => {
    const selectedProjectRow = row.original;
    setSelectedProject(selectedProjectRow);
  };

  return (
    <>
      <Typography className="pageTitle">
        Projects
      </Typography>
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
              children: errorMessage,
            }
            : undefined
        }
        muiLinearProgressProps={({ isTopToolbar }) => ({
          color: 'secondary',
          sx: { display: isTopToolbar ? 'block' : 'none' },
        })}
        muiTableProps={{
          sx: {
            width: 'auto', tableLayout: 'auto', '& td:last-child': { width: '100%' }, '& th:last-child': { width: '100%' },
          },
        }}
        muiTableBodyRowProps={({ row }) => ({
          onClick: () => rowClickHandler(row),
        })}
      />
    </>
  );
}
export default ProjectsList;
