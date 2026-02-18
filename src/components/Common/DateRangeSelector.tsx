import React, { SetStateAction } from 'react';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';

export enum DateRangeValues {
  today = 'Today',
  last_week = 'Last week',
  last_month = 'Last month',
  last_3_months = 'Last 3 months',
  last_6_months = 'Last 6 months',
  last_year = 'Last year',
  all_time = 'All time',
}

// Get start and end time based on DateRangeSelector
export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangeSelectorProps {
  setDateRange: React.Dispatch<SetStateAction<DateRange>>;
  dateRangeString: DateRangeValues;
  setDateRangeString: React.Dispatch<SetStateAction<DateRangeValues>>;
}

export const getDateRangeFromSelector = (range: DateRangeValues) => {
  // Currently this returns rolling date ranges
  const now = new Date();
  const endDate = new Date(now);
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  switch (range) {
    case DateRangeValues.today:
      return { startDate: startOfToday, endDate };

    case DateRangeValues.last_week: {
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - 7);
      return { startDate: start, endDate };
    }

    case DateRangeValues.last_month: {
      const start = new Date(startOfToday);
      start.setMonth(start.getMonth() - 1);
      return { startDate: start, endDate };
    }

    case DateRangeValues.last_3_months: {
      const start = new Date(startOfToday);
      start.setMonth(start.getMonth() - 3);
      return { startDate: start, endDate };
    }

    case DateRangeValues.last_6_months: {
      const start = new Date(startOfToday);
      start.setMonth(start.getMonth() - 6);
      return { startDate: start, endDate };
    }

    case DateRangeValues.last_year: {
      const start = new Date(startOfToday);
      start.setFullYear(start.getFullYear() - 1);
      return { startDate: start, endDate };
    }

    case DateRangeValues.all_time:
      return { startDate: null, endDate: null };

    default:
      return { startDate: null, endDate: null };
  }
};

export function DateRangeSelector(props: DateRangeSelectorProps) {
  const { dateRangeString, setDateRangeString, setDateRange } = props;

  const handleDateChange = (value: DateRangeValues) => {
    setDateRangeString(value);
    setDateRange(getDateRangeFromSelector(value));
  };

  return (
    <FormControl variant="standard" style={{ minWidth: 150, marginRight: 10 }}>
      <InputLabel>Date range</InputLabel>
      <Select
        value={dateRangeString}
        onChange={(event) => { handleDateChange(event.target.value as DateRangeValues); }}
      >
        {Object.values(DateRangeValues).map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
