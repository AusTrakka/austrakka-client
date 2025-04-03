import React, { useEffect, useState } from 'react';
import { Alert, AlertTitle, Box, Tooltip, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { DataTable, DataTableRowClickEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import LoadingState from '../../../../constants/loadingState';
import DrilldownButton from '../../../Common/DrilldownButton';
import { useApi } from '../../../../app/ApiContext';
import { formatDateAsTwoIsoStrings } from '../../../../utilities/dateUtils';
import { ResponseObject } from '../../../../types/responseObject.interface';
import { getProjectList } from '../../../../utilities/resourceUtils';
import { ResponseType } from '../../../../constants/responseType';
import { Project } from '../../../../types/dtos';
import { compareProperties, isNullOrEmpty } from '../../../../utilities/dataProcessingUtils';

const renderDateWithTimeTooltip = (cell: string): JSX.Element | null => {
  if (isNullOrEmpty(cell)) return null;
  const [date, time] = formatDateAsTwoIsoStrings(cell);
  return (
    <Tooltip title={`${date} ${time}`}>
      <span>{date}</span>
    </Tooltip>
  );
};

const columns = [
  { field: 'name', header: 'Project Name' },
  { field: 'sampleCount', header: 'Samples', align: 'center' },
  { field: 'latestSampleDate', header: 'Latest sample', body: (rowData: any) => renderDateWithTimeTooltip(rowData.latestSampleDate) },
  { field: 'latestSequenceDate', header: 'Latest sequence', body: (rowData: any) => renderDateWithTimeTooltip(rowData.latestSequenceDate) },
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
        projectResponse.data.sort((a: Project, b: Project) =>
          compareProperties(a, b, [
            [(x => x.latestSequenceDate), -1],
            [(x => x.latestSampleDate), -1],
          ]));
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
              align={col.align ?? 'left'}
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
