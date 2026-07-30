import FilterListIcon from '@mui/icons-material/FilterList';
import {
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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import type { DataTableFilterMeta } from 'primereact/datatable';
import { useEffect, useMemo, useState } from 'react';
import type { ProjectMetadataState } from '../../app/projectMetadataSlice';
import { DashboardTimeFilter } from '../../constants/dashboardTimeFilter';
import { hasCompleteData } from '../../constants/metadataLoadingState';
import type { Sample } from '../../types/sample.interface';

// This component is designed to be used in both project and org dashboards
// It builds filter objects in the structure to be applied to the Prime React DataTable components

interface DashboardFilterProps {
  data: ProjectMetadataState | null; // Need to account for org metadata
  dateField: string;
  setDateField: (field: string) => void;
  setTimeFilterObject: (filter: DataTableFilterMeta) => void;
  setFilteredData: (data: Sample[]) => void;
}

function DashboardFilter(props: DashboardFilterProps) {
  const { data, dateField, setDateField, setTimeFilterObject, setFilteredData } = props;

  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const openFilter = Boolean(filterAnchorEl);
  // const [dateField, setDateField] = useState<string>(DefaultDashboardTimeFilterField);
  const [customDateRange, setCustomDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [timeFilter, setTimeFilter] = useState<DashboardTimeFilter>(DashboardTimeFilter.ALL);
  const [timeFilterThreshold, setTimeFilterThreshold] = useState<Date | null>(null);
  // this state variable will be passed as prop for line-list filters
  const timeFilterObject: DataTableFilterMeta = useMemo(() => {
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

  const projectDateFields = useMemo(() => {
    if (!hasCompleteData(data?.loadingState) || !data?.fields) return [];
    return data.fields
      .filter((field) => field.primitiveType === 'date')
      .map((field) => field.projectFieldName);
  }, [data]);

  const filteredDataMemo = useMemo(() => {
    if (!data || !hasCompleteData(data?.loadingState)) return [];
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

  useEffect(() => {
    setTimeFilterObject(timeFilterObject);
    setFilteredData(filteredDataMemo);
  }, [timeFilterObject, filteredDataMemo, setTimeFilterObject, setFilteredData]);

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
}

export default DashboardFilter;
