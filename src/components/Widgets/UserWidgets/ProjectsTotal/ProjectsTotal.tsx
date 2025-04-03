import React, { useEffect, useState } from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DataTable, DataTableRowClickEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import LoadingState from '../../../../constants/loadingState';
import DrilldownButton from '../../../Common/DrilldownButton';
import { useApi } from '../../../../app/ApiContext';
import { isoDateLocalDate } from '../../../../utilities/dateUtils';
import { ResponseObject } from '../../../../types/responseObject.interface';
import { getProjectList } from '../../../../utilities/resourceUtils';
import { ResponseType } from '../../../../constants/responseType';
import { Project } from '../../../../types/dtos';

const columns = [
  { field: 'name', header: 'Project Name' },
  { field: 'sampleCount', header: 'Samples uploaded' },
  { field: 'latestSampleDate', header: 'Latest sample', body: (rowData: any) => isoDateLocalDate(rowData.latestSampleDate) },
];

export default function ProjectsTotal() {
  const { token, tokenLoading } = useApi();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function getProjects() { // TODO maybe move to utility?
      const projectResponse: ResponseObject = await getProjectList(token);
      if (projectResponse.status === ResponseType.Success) {
        setProjects(projectResponse.data);
      } else {
        setErrorMessage(projectResponse.error);
      }
      setIsLoading(false);
    }

    if (tokenLoading !== LoadingState.LOADING && tokenLoading !== LoadingState.IDLE) {
      getProjects();
    }
  }, [token, tokenLoading]);

  const navigateToProjectList = () => {
    navigate('/projects');
  };

  const rowClickHandler = (row: DataTableRowClickEvent) => {
    const selectedRow = row.data;
    navigate(`/projects/${selectedRow.abbreviation}`);
  };

  return (
    <Box>
      <Typography variant="h5" paddingBottom={3} color="primary">
        Project Status
      </Typography>
      { isLoading || errorMessage || (
      <>
        <DataTable
          value={projects}
          size="small"
          onRowClick={rowClickHandler}
          selectionMode="single"
        >
          {columns.map((col: any) => (
            <Column
              key={col.field}
              field={col.field}
              header={col.header}
              body={col.body}
            />
          ))}
        </DataTable>
        <br />
        <DrilldownButton
          title="View all projects"
          onClick={navigateToProjectList}
        />
      </>
      )}
      { errorMessage && (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {errorMessage}
        </Alert>
      )}
      { isLoading && (
        <div>Loading...</div>
      )}
    </Box>
  );
}
