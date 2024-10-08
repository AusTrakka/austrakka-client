import React, { useEffect, useState } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tooltip,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { DataTableFilterMeta } from 'primereact/datatable';
import DashboardTemplates from '../../../config/dashboardTemplates';
import DashboardTimeFilter from '../../../constants/dashboardTimeFilter';
import { useAppSelector } from '../../../app/store';
import LoadingState from '../../../constants/loadingState';
import { useApi } from '../../../app/ApiContext';
import { ProjectMetadataState, selectProjectMetadata } from '../../../app/projectMetadataSlice';
import { getProjectDashboard } from '../../../utilities/resourceUtils';
import { ResponseType } from '../../../constants/responseType';
import { Sample } from '../../../types/sample.interface';
import MetadataLoadingState from '../../../constants/metadataLoadingState';
import ProjectDashboardTemplateProps from '../../../types/projectdashboardtemplate.props.interface';

// NB this is a tab; project metadata is requested in ProjectOverview page;
// if we want to use this as a standalone page must dispatch request

// Field used to filter data by date
const DATE_FIELD_NAME = 'Date_created';

interface ProjectDashboardProps {
  projectDesc: string,
  projectAbbrev: string | null,
}

function ProjectDashboard(props: ProjectDashboardProps) {
  const { projectDesc, projectAbbrev } = props;
  const { token, tokenLoading } = useApi();
  const [dashboardName, setDashboardName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const data: ProjectMetadataState | null =
    useAppSelector(state => selectProjectMetadata(state, projectAbbrev));
  const [timeFilter, setTimeFilter] = useState<DashboardTimeFilter>(DashboardTimeFilter.ALL);
  const [timeFilterThreshold, setTimeFilterThreshold] = useState<Date | null>(null);
  const [filteredData, setFilteredData] = useState<Sample[]>([]);

  // this state variable will be passed as prop for line-list filters
  const timeFilterObject : DataTableFilterMeta = timeFilterThreshold ? {
    [DATE_FIELD_NAME]: {
      operator: FilterOperator.AND,
      constraints: [
        {
          value: timeFilterThreshold,
          matchMode: FilterMatchMode.DATE_AFTER,
        }],
    },
  } : {};
  
  function renderDashboard() {
    if (!dashboardName || !projectAbbrev) {
      return React.createElement(() => null);
    }
    if (typeof DashboardTemplates[dashboardName] === 'undefined') {
      setErrorMessage(`Dashboard type ${dashboardName} is not known`);
      return React.createElement(() => null);
    }
    const dashboardProps: ProjectDashboardTemplateProps = {
      projectAbbrev, filteredData, timeFilterObject,
    };
    return React.createElement(
      DashboardTemplates[dashboardName],
      dashboardProps,
    );
  }
  
  useEffect(() => {
    async function getDashboardName() {
      const response = await getProjectDashboard(projectAbbrev!, token);
      if (response.status === ResponseType.Success) {
        setDashboardName(response.data);
      } else {
        setErrorMessage('Error retrieving project dashboard');
      }
    }
    
    if (projectAbbrev &&
        tokenLoading !== LoadingState.LOADING &&
        tokenLoading !== LoadingState.IDLE) {
      getDashboardName();
    }
  }, [token, tokenLoading, projectAbbrev]);
  
  // Filter data by date
  useEffect(() => {
    // Could be moved to dataProcessingUtils
    const filterDataAfterDate = (
      inputdata: Sample[],
      dateField: string,
      threshold: Date | null,
    ) => {
      if (!threshold) {
        return inputdata;
      }
      // This line only reached if dateField present; otherwise control to set threshold is disabled
      return inputdata.filter((sample) => dayjs(sample[dateField]!).isAfter(dayjs(threshold)));
    };
    
    if (data?.loadingState === MetadataLoadingState.DATA_LOADED) {
      setFilteredData(
        filterDataAfterDate(data!.metadata!, DATE_FIELD_NAME, timeFilterThreshold),
      );
    }
  }, [data, timeFilterThreshold]);
  
  const onTimeFilterChange = (event: SelectChangeEvent) => {
    let value: Date | undefined;

    if (event.target.value === DashboardTimeFilter.LAST_WEEK) {
      value = dayjs().subtract(7, 'days').toDate();
    } else if (event.target.value === DashboardTimeFilter.LAST_MONTH) {
      value = dayjs().subtract(1, 'month').toDate();
    }

    setTimeFilterThreshold(value || null);
    setTimeFilter(event.target.value as DashboardTimeFilter);
  };
  
  const renderDateSelector = () => {
    const enabled = (data?.projectFields &&
      data.projectFields.some(field => field.fieldName === DATE_FIELD_NAME));
    
    return (
      <Tooltip title={enabled ? '' : `${DATE_FIELD_NAME} field not found`}>
        <FormControl variant="standard" disabled={!enabled}>
          <InputLabel>Date filter</InputLabel>
          <Select autoWidth value={timeFilter} onChange={onTimeFilterChange}>
            <MenuItem value={DashboardTimeFilter.ALL}>
              All time
            </MenuItem>
            <MenuItem value={DashboardTimeFilter.LAST_WEEK}>
              Last week
            </MenuItem>
            <MenuItem value={DashboardTimeFilter.LAST_MONTH}>
              Last month
            </MenuItem>
          </Select>
        </FormControl>
      </Tooltip>
    );
  };
  
  return (
    <Box>
      <Grid container direction="row" spacing={2}>
        { dashboardName && data?.loadingState === MetadataLoadingState.DATA_LOADED && (
          <>
            <Grid container item xs={12} justifyContent="space-between">
              <Typography>{projectDesc}</Typography>
              { renderDateSelector() }
            </Grid>
            <Grid container item xs={12} sx={{ marginTop: 1, paddingRight: 2, paddingBottom: 2, backgroundColor: 'var(--primary-main-bg)' }}>
              {renderDashboard()}
            </Grid>
          </>
        )}
        { errorMessage && (
          <Grid item xs={12}>
            <Alert severity="error">
              <AlertTitle>Error</AlertTitle>
              {`An error occurred while loading your dashboard - ${errorMessage}`}
            </Alert>
          </Grid>
        )}
        { !(dashboardName && data?.loadingState === MetadataLoadingState.DATA_LOADED)
          && !errorMessage && (
          <Grid item xs={12}>
            Loading...
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
export default ProjectDashboard;
