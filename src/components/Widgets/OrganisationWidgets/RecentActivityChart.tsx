import { Alert, AlertTitle, Box, Chip, CircularProgress, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { type ECharts, type EChartsOption, getInstanceByDom, init } from 'echarts';
import { memo, useEffect, useRef, useState } from 'react';
import { Theme } from '../../../assets/themes/theme';
import type RecordTypes from '../../../constants/record-type.enum';
import useActivityLogs from '../../../hooks/useActivityLogs';
import type { WidgetType } from '../../../types/widget.props';
import { getWidgetExportName } from '../../../utilities/fileUtils';
import type { Filters } from '../../Common/Activity/ActivityFilters';
import ChartInfoTooltip from '../ProjectWidgets/EChartsWidgets/InfoToolTip';

function buildChartData(
  refinedLogs: { eventTime: string; eventType?: string }[] | null | undefined,
) {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    days.push(dayjs().subtract(i, 'day').format('ddd DD'));
  }

  const countsByType: Record<string, Record<string, number>> = {};
  for (const log of refinedLogs ?? []) {
    const day = dayjs(log.eventTime).format('ddd DD');
    const type = log.eventType ?? 'Unknown';
    if (!countsByType[type]) {
      countsByType[type] = Object.fromEntries(days.map((d) => [d, 0]));
    }
    if (day in countsByType[type]) countsByType[type][day]++;
  }

  return { days, countsByType };
}

interface RecentActivityChartProps {
  widgetType: WidgetType;
  recordType: RecordTypes;
  identifier: string;
  title?: string | undefined;
}

const CHART_HEIGHT = 280;

function RecentActivityChart(props: RecentActivityChartProps) {
  const { recordType, identifier, title } = props;
  const chartRef = useRef<HTMLDivElement>(null);
  const today = dayjs();
  const lastWeek = dayjs().subtract(7, 'day');
  const [filters] = useState<Filters>({
    startDate: lastWeek.toDate(),
    endDate: today.toDate(),
    resourceUniqueString: null,
    resourceType: null,
    eventType: null,
    submitterDisplayName: null,
  });

  const { refinedLogs, dataLoading, isLoadingErrorMsg } = useActivityLogs(
    recordType,
    filters,
    identifier,
  );

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = init(chartRef.current);
    return () => chart.dispose();
  }, []);

  useEffect(() => {
    if (!chartRef.current || dataLoading) return;
    const chart: ECharts = getInstanceByDom(chartRef.current) ?? init(chartRef.current);

    const { days, countsByType } = buildChartData(refinedLogs);

    const series: EChartsOption['series'] = Object.entries(countsByType).map(
      ([eventType, dayCounts]) => ({
        name: eventType,
        type: 'bar',
        stack: 'total',
        barMaxWidth: 60,
        barCategoryGap: '10%',
        emphasis: { focus: 'series' },
        data: days.map((d) => dayCounts[d]),
      }),
    );

    const option: EChartsOption = {
      toolbox: {
        feature: {
          saveAsImage: {
            title: 'Export to PNG',
            pixelRatio: 2,
            name: getWidgetExportName('recent_activity_chart'),
          },
        },
        emphasis: {
          iconStyle: { borderColor: Theme.SecondaryMain },
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        appendTo: () => document.body,
        confine: false,
        formatter: (params) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const dayLabel = days[params[0].dataIndex];
          const active = params.filter((p) => (p.value as number) > 0);
          const total = params.reduce((sum, p) => sum + ((p.value as number) ?? 0), 0);
          const rows = active
            .map((p) => `${p.marker}${p.seriesName}: <b>${p.value}</b>`)
            .join('<br/>');
          return `${dayLabel}<br/>${rows}<br/> Total: <b>${total}</b>`;
        },
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        icon: 'square',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 10 },
      },
      grid: { right: 24, bottom: 85, top: 16, left: 56 },
      xAxis: {
        type: 'category',
        data: days,
        name: 'Day',
        nameLocation: 'middle',
        nameGap: 32,
        axisLabel: { fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        name: 'Event Count',
        nameLocation: 'middle',
        nameGap: 40,
        minInterval: 1,
      },
      series,
    };

    chart.off('click');
    chart.setOption(option, true);
  }, [refinedLogs, dataLoading]);

  useEffect(() => {
    if (!chartRef.current) return;
    const observer = new ResizeObserver(() => {
      getInstanceByDom(chartRef.current!)?.resize();
    });
    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  let chartContent: React.ReactNode;
  if (isLoadingErrorMsg) {
    chartContent = (
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        {isLoadingErrorMsg}
      </Alert>
    );
  } else if (dataLoading) {
    chartContent = (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: CHART_HEIGHT,
        }}
      >
        <CircularProgress size={24} />
      </Box>
    );
  } else if (!refinedLogs?.length) {
    chartContent = (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: CHART_HEIGHT,
        }}
      >
        <Typography variant="body2" color={Theme.SecondaryMain}>
          No activity in the last 7 days
        </Typography>
      </Box>
    );
  } else {
    chartContent = <div ref={chartRef} style={{ width: '100%', height: `${CHART_HEIGHT}px` }} />;
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography
          variant="h5"
          paddingBottom={3}
          color="primary"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
        >
          {title ?? 'Recent Activity'}
          <ChartInfoTooltip text={`Click legend items to show/hide · Hover for details`} />
        </Typography>
        <Chip
          label="Last 7 days"
          variant="outlined"
          sx={{ borderColor: Theme.SecondaryMain, color: Theme.SecondaryMain }}
        />
      </Box>
      {isLoadingErrorMsg && (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {isLoadingErrorMsg}
        </Alert>
      )}
      {chartContent}
    </Box>
  );
}

export default memo(RecentActivityChart);
