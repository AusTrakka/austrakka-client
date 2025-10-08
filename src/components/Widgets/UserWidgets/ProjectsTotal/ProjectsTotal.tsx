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
import { getUserDashboardProjects } from '../../../../utilities/resourceUtils';
import { ResponseType } from '../../../../constants/responseType';
import { ProjectSummary } from '../../../../types/dtos';
import { compareProperties, isNullOrEmpty } from '../../../../utilities/dataProcessingUtils';
import sortIcon from '../../../TableComponents/SortIcon';

const renderDateWithTimeTooltip = (cell: string): JSX.Element | null => {
  if (isNullOrEmpty(cell)) return <span>None</span>;
  const [date, time] = formatDateAsTwoIsoStrings(cell);
  return (
    <Tooltip title={`${date} ${time}`}>
      <span>{date}</span>
    </Tooltip>
  );
};

const columns = [
  { field: 'name', header: 'Project Name' },
  { field: 'sampleCount',
    header: 'Samples' },
  { field: 'latestSampleDate',
    header: 'Latest sample',
    body: (rowData: any) => renderDateWithTimeTooltip(rowData.latestSampleDate) },
  { field: 'latestSequenceDate',
    header: 'Latest sequence',
    body: (rowData: any) => renderDateWithTimeTooltip(rowData.latestSequenceDate) },
  { field: 'latestTreeDate',
    header: 'Latest tree',
    body: (rowData: any) => renderDateWithTimeTooltip(rowData.latestTreeDate) },
];

export default function ProjectsTotal() {
  const { token, tokenLoading } = useApi();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [projects, setProjects] = React.useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function getProjects() {
      const projectResponse: ResponseObject<ProjectSummary[]> =
          await getUserDashboardProjects(token);
      if (projectResponse.data && projectResponse.status === ResponseType.Success) {
        const { data } = projectResponse;
        const processedProjs = data
          .filter((p: ProjectSummary) =>
            p.clientType === import.meta.env.VITE_BRANDING_ID)
          .sort((a: ProjectSummary, b: ProjectSummary) =>
            compareProperties(a, b, [
              [(x => x.latestSequenceDate), -1],
              [(x => x.latestSampleDate), -1],
            ]));
        setProjects(processedProjs);
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
      { isLoading || errorMessage != null || (
      <>
        <DataTable
          value={projects}
          size="small"
          onRowClick={rowClickHandler}
          scrollable
          scrollHeight="calc(100vh - 600px)"
          removableSort
          sortIcon={sortIcon}
          selectionMode="single"
        >
          {columns.map((col: any) => (
            <Column
              key={col.field}
              field={col.field}
              header={col.header}
              body={col.body}
              sortable
              style={{ minWidth: '100px' }}
              headerClassName="custom-title"
              bodyClassName="value-cells"
            />
          ))}
        </DataTable>
        <br />
        <DrilldownButton
          title="View projects table"
          onClick={navigateToProjectList}
        />
      </>
      )}
      { errorMessage != null && (
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
