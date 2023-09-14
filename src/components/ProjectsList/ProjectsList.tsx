import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table';
import { Typography } from '@mui/material';
import isoDateLocalDate from '../../utilities/helperUtils';
import { getProjectList, ResponseObject } from '../../utilities/resourceUtils';
import { useApi } from '../../app/ApiContext';
import LoadingState from '../../constants/loadingState';

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
  { header: 'Created', accessorKey: 'created', Cell: ({ cell }: any) => <>{isoDateLocalDate(cell.getValue())}</> },
];

function ProjectsList() {
  const [projectsList, setProjectsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedProject, setSelectedProject] = useState({});
  const navigate = useNavigate();
  const { token, tokenLoading } = useApi();

  useEffect(() => {
    async function getProject() {
      const projectResponse: ResponseObject = await getProjectList(token);
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
    // NEW: Only call endpoint if token has already been retrieved/attempted to be retrieved
    // Otherwise the first endpoint call will always be unsuccessful
    if (tokenLoading !== LoadingState.IDLE && tokenLoading !== LoadingState.LOADING) {
      getProject();
    }
  }, [token, tokenLoading]);

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
            'width': 'auto', 'tableLayout': 'auto', '& td:last-child': { width: '100%' }, '& th:last-child': { width: '100%' },
          },
        }}
        muiTableBodyRowProps={({ row }) => ({
          onClick: () => rowClickHandler(row),
          sx: {
            cursor: 'pointer',
          },
        })}
      />
    </>
  );
}
export default ProjectsList;
