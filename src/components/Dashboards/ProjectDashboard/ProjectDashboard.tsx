import FilterListIcon from '@mui/icons-material/FilterList';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  FormControl,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import type { DataTableFilterMeta } from 'primereact/datatable';
import React, { createElement, memo, useEffect, useState } from 'react';
import { useApi } from '../../../app/ApiContext';
import {
  type ProjectMetadataState,
  selectProjectMetadata,
} from '../../../app/projectMetadataSlice';
import { useAppSelector } from '../../../app/store';
import { Theme } from '../../../assets/themes/theme';
import DashboardTemplates from '../../../config/dashboardTemplates';
import {
  DashboardTimeFilter,
  DefaultDashboardTimeFilterField,
} from '../../../constants/dashboardTimeFilter';
import LoadingState from '../../../constants/loadingState';
import MetadataLoadingState from '../../../constants/metadataLoadingState';
import { ResponseType } from '../../../constants/responseType';
import type { ProjectDashboardDetails } from '../../../types/dtos';
import type ProjectDashboardTemplateProps from '../../../types/projectdashboardtemplate.props.interface';
import { getProjectDashboard } from '../../../utilities/resourceUtils';

// NB this is a tab; project metadata is requested in ProjectOverview page;
// if we want to use this as a standalone page must dispatch request

function DashboardStatusAlert(
  errorMessage: string | null,
  dashboardName: string | null,
  loadingState: MetadataLoadingState | undefined,
): React.ReactElement | null {
  if (errorMessage) {
    return (
      <Grid size={12}>
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {`An error occurred while loading your dashboard - ${errorMessage}`}
        </Alert>
      </Grid>
    );
  }

  if (!dashboardName) {
    return (
      <Grid size={12}>
        <Alert severity="warning">
          <AlertTitle>No Dashboard Selected</AlertTitle>
          Please select a dashboard to view data.
        </Alert>
      </Grid>
    );
  }

  if (loadingState === MetadataLoadingState.FIELDS_LOADED) {
    return (
      <Grid size={12}>
        <Alert severity="warning">
          <AlertTitle>No Data Available</AlertTitle>
          Dashboard fields loaded but no data was returned.
        </Alert>
      </Grid>
    );
  }

  if (loadingState !== MetadataLoadingState.DATA_LOADED) {
    return (
      <Grid size={12}>
        <Alert severity="info">
          <AlertTitle>Loading</AlertTitle>
          Loading dashboard data...
        </Alert>
      </Grid>
    );
  }

  return null;
}

interface ProjectDashboardProps {
  projectDesc: string;
  projectAbbrev: string | null;
}

function ProjectDashboard(props: ProjectDashboardProps) {
  const { projectDesc, projectAbbrev } = props;
  const { token, tokenLoading } = useApi();
  const [dashboardName, setDashboardName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const data: ProjectMetadataState | null = useAppSelector((state) =>
    selectProjectMetadata(state, projectAbbrev),
  );
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const openFilter = Boolean(filterAnchorEl);
  const [dateField, setDateField] = useState<string>(DefaultDashboardTimeFilterField);
  const [customDateRange, setCustomDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [timeFilter, setTimeFilter] = useState<DashboardTimeFilter>(DashboardTimeFilter.ALL);
  const [timeFilterThreshold, setTimeFilterThreshold] = useState<Date | null>(null);
  // this state variable will be passed as prop for line-list filters
  const timeFilterObject: DataTableFilterMeta = React.useMemo(() => {
    if (timeFilter !== DashboardTimeFilter.CUSTOM && !timeFilterThreshold)
      return {} as DataTableFilterMeta;
    if (timeFilter === DashboardTimeFilter.CUSTOM) {
      if (!customDateRange.start || !customDateRange.end) return {} as DataTableFilterMeta;
      return {
        [dateField]: {
          operator: FilterOperator.AND,
          constraints: [
            {
              value: customDateRange.start,
              matchMode: FilterMatchMode.DATE_AFTER,
            },
            {
              value: customDateRange.end,
              matchMode: FilterMatchMode.DATE_BEFORE,
            },
          ],
        },
      };
    }
    return {
      [dateField]: {
        operator: FilterOperator.AND,
        constraints: [
          {
            value: timeFilterThreshold,
            matchMode: FilterMatchMode.DATE_AFTER,
          },
        ],
      },
    };
  }, [timeFilterThreshold, dateField, timeFilter, customDateRange.start, customDateRange.end]);

  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setFilterAnchorEl(null);
    if (
      timeFilter === DashboardTimeFilter.CUSTOM &&
      (!customDateRange.start || !customDateRange.end)
    ) {
      setTimeFilter(DashboardTimeFilter.ALL);
      setCustomDateRange({ start: null, end: null });
    }
  };

  const projectDateFields = React.useMemo(() => {
    if (data?.loadingState !== MetadataLoadingState.DATA_LOADED || !data.fields) return [];
    return data.fields
      .filter((field) => field.primitiveType === 'date')
      .map((field) => field.projectFieldName);
  }, [data]);
  const filteredDataMemo = React.useMemo(() => {
    if (data?.loadingState !== MetadataLoadingState.DATA_LOADED) return [];
    if (timeFilter === DashboardTimeFilter.CUSTOM && customDateRange.start && customDateRange.end) {
      return data.metadata!.filter((sample) => {
        const sampleDate = dayjs(sample[dateField]!);
        return (
          sampleDate.isAfter(dayjs(customDateRange.start)) &&
          sampleDate.isBefore(dayjs(customDateRange.end))
        );
      });
    }
    if (!timeFilterThreshold) return data.metadata!;
    // Re-use your filtering function here or inline logic
    return data.metadata!.filter((sample) =>
      dayjs(sample[dateField]!).isAfter(dayjs(timeFilterThreshold)),
    );
  }, [
    data,
    timeFilterThreshold,
    dateField,
    customDateRange.end,
    customDateRange.start,
    timeFilter,
  ]);

  const dashBoardElements = React.useMemo(() => {
    if (!dashboardName || !projectAbbrev) {
      return createElement(() => null);
    }
    if (typeof DashboardTemplates[dashboardName] === 'undefined') {
      setErrorMessage(`Dashboard type ${dashboardName} is not known`);
      return createElement(() => null);
    }

    const dashboardProps: ProjectDashboardTemplateProps = {
      projectAbbrev,
      filteredData: filteredDataMemo,
      timeFilterObject,
      dateFilterField: dateField,
    };

    return createElement(DashboardTemplates[dashboardName], dashboardProps);
  }, [dashboardName, projectAbbrev, filteredDataMemo, timeFilterObject, dateField]);

  useEffect(() => {
    async function getDashboardName() {
      const response = await getProjectDashboard(projectAbbrev!, token);
      if (response.status === ResponseType.Success) {
        const dashboard: ProjectDashboardDetails = response.data;
        setDashboardName(dashboard.name);
      } else {
        setErrorMessage('Error retrieving project dashboard');
      }
    }

    if (
      projectAbbrev &&
      tokenLoading !== LoadingState.LOADING &&
      tokenLoading !== LoadingState.IDLE
    ) {
      getDashboardName();
    }
  }, [token, tokenLoading, projectAbbrev]);

  // Filter data by date

  const onTimeFilterChange = (event: SelectChangeEvent) => {
    let value: Date | undefined;

    if (event.target.value === DashboardTimeFilter.LAST_WEEK) {
      value = dayjs().subtract(7, 'days').toDate();
    } else if (event.target.value === DashboardTimeFilter.LAST_MONTH) {
      value = dayjs().subtract(1, 'month').toDate();
    } else if (event.target.value === DashboardTimeFilter.LAST_3_MONTHS) {
      value = dayjs().subtract(3, 'months').toDate();
    } else if (event.target.value === DashboardTimeFilter.CURRENT_YEAR) {
      value = dayjs().startOf('year').toDate();
    } else if (event.target.value === DashboardTimeFilter.LAST_12_MONTHS) {
      value = dayjs().subtract(1, 'year').toDate();
    }

    setTimeFilterThreshold(value || null);
    setTimeFilter(event.target.value as DashboardTimeFilter);
  };

  const handleFilterDateChange = (newDate: any, field: 'start' | 'end') => {
    const newDateValue = newDate ? dayjs(newDate).toDate() : null;
    setCustomDateRange((prev) => ({
      ...prev,
      [field]: newDateValue,
    }));
  };

  const renderDateFieldSelector = () => {
    return (
      <FormControl variant="standard">
        <InputLabel>Date field</InputLabel>
        <Select
          autoWidth
          sx={{ minWidth: 100 }}
          value={dateField}
          onChange={(e) => setDateField(e.target.value)}
        >
          {projectDateFields.map((field) => (
            <MenuItem key={field} value={field}>
              {field}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  };

  const renderDateSelector = () => {
    const enabled = data?.projectFields?.some((field) => field.fieldName === dateField);

    return (
      <>
        <Tooltip title={enabled ? '' : `${dateField} field not found`}>
          <FormControl variant="standard" disabled={!enabled}>
            <InputLabel>Range</InputLabel>
            <Select
              autoWidth
              sx={{ minWidth: 120 }}
              value={timeFilter}
              onChange={onTimeFilterChange}
            >
              <MenuItem value={DashboardTimeFilter.ALL}>All time</MenuItem>
              <MenuItem value={DashboardTimeFilter.LAST_WEEK}>Last week</MenuItem>
              <MenuItem value={DashboardTimeFilter.LAST_MONTH}>Last month</MenuItem>
              <MenuItem value={DashboardTimeFilter.LAST_3_MONTHS}>Last 3 months</MenuItem>
              <MenuItem value={DashboardTimeFilter.CURRENT_YEAR}>Current year</MenuItem>
              <MenuItem value={DashboardTimeFilter.LAST_12_MONTHS}>Last 12 months</MenuItem>
              <MenuItem value={DashboardTimeFilter.CUSTOM}>Custom</MenuItem>
            </Select>
          </FormControl>
        </Tooltip>
        {timeFilter === DashboardTimeFilter.CUSTOM && (
          <Stack direction="column" spacing={1} mt={2}>
            <DatePicker
              label="From"
              value={customDateRange.start ? dayjs(customDateRange.start) : null}
              onChange={(newValue) => handleFilterDateChange(newValue, 'start')}
              format="YYYY-MM-DD"
              disableFuture
              slotProps={{
                textField: {
                  size: 'small',
                  sx: {
                    '& .MuiInputBase-input': {
                      flex: 1,
                      minWidth: 0,
                    },
                  },
                },
              }}
            />
            <DatePicker
              label="To"
              value={customDateRange.end ? dayjs(customDateRange.end) : null}
              onChange={(newValue) => handleFilterDateChange(newValue, 'end')}
              format="YYYY-MM-DD"
              disableFuture
              slotProps={{
                textField: {
                  size: 'small',
                  sx: {
                    '& .MuiInputBase-input': {
                      flex: 1,
                      minWidth: 0,
                    },
                  },
                },
              }}
            />
          </Stack>
        )}
      </>
    );
  };

  const renderDashboardFilter = () => {
    return (
      <>
        <Button
          variant="outlined"
          size="small"
          startIcon={<FilterListIcon />}
          onClick={handleFilterClick}
          sx={{ textTransform: 'none' }}
        >
          Date filter
        </Button>

        <Menu
          anchorEl={filterAnchorEl}
          open={openFilter}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          slotProps={{
            paper: {
              sx: { mt: 1 },
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              padding: 2,
              paddingTop: 1,
              gap: 2,
              width: 200,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }} color="primary">
              Date filter
            </Typography>
            {renderDateFieldSelector()}
            {renderDateSelector()}
          </Box>
        </Menu>
      </>
    );
  };
  return (
    <Box>
      <Grid container direction="row" spacing={2}>
        {dashboardName && data?.loadingState === MetadataLoadingState.DATA_LOADED && (
          <>
            <Grid container size={12} justifyContent="space-between">
              <Stack
                direction="row"
                width="100%"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography sx={{ maxWidth: '90%' }}>{projectDesc}</Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  {renderDashboardFilter()}
                </Stack>
              </Stack>
            </Grid>
            <Grid
              container
              size={12}
              sx={{
                marginTop: 1,
                padding: 2,
                backgroundColor: Theme.PrimaryMainBackground,
              }}
            >
              {dashBoardElements}
            </Grid>
          </>
        )}
        {DashboardStatusAlert(errorMessage, dashboardName, data?.loadingState)}
      </Grid>
    </Box>
  );
}

export default memo(ProjectDashboard);
