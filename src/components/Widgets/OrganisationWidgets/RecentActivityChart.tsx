import { Alert, AlertTitle, Box, Chip, CircularProgress, Typography } from '@mui/material';
import dayjs from 'dayjs';
import {
  type ECElementEvent,
  type ECharts,
  type EChartsOption,
  getInstanceByDom,
  init,
} from 'echarts';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useStableNavigate } from '../../../app/NavigationContext';
import { Theme } from '../../../assets/themes/theme';
import type RecordTypes from '../../../constants/record-type.enum';
import useActivityLogs from '../../../hooks/useActivityLogs';
import type { WidgetType } from '../../../types/widget.props';
import { getWidgetExportName } from '../../../utilities/fileUtils';
import { updateActivityTabUrlWithFilters } from '../../../utilities/navigationUtils';
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
  const { navigate } = useStableNavigate();

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

  const showChart = !dataLoading && !isLoadingErrorMsg && !!refinedLogs?.length;

  const handleClick = useCallback(
    (params: ECElementEvent) => {
      const eventType = params.seriesName;
      const startDate = dayjs(params.name, 'ddd DD').startOf('day').toDate();
      const endDate = dayjs(params.name, 'ddd DD').endOf('day').toDate();
      updateActivityTabUrlWithFilters(navigate, '/activity', {
        eventType,
        startDate,
        endDate,
      });
    },
    [navigate],
  );

  useEffect(() => {
    if (!chartRef.current || dataLoading) return;
    const chart: ECharts = getInstanceByDom(chartRef.current) ?? init(chartRef.current);
    chart.off('click');
    chart.on('click', handleClick);

    const { days, countsByType } = buildChartData(refinedLogs);

    const series: EChartsOption['series'] = Object.entries(countsByType).map(
      ([eventType, dayCounts]) => ({
        name: eventType,
        type: 'line',
        smooth: false,
        symbol: 'circle',
        symbolSize: 6,
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
        axisPointer: { type: 'line' },
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
        type: 'scroll',
        orient: 'horizontal',
        bottom: 0,
        icon: 'square',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 10 },
      },
      grid: { right: 50, bottom: 90, top: 16, left: 60 },
      xAxis: {
        type: 'category',
        data: days,
        name: 'Day',
        nameLocation: 'middle',
        nameGap: 32,
        boundaryGap: false,
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

    chart.setOption(option, true);
  }, [refinedLogs, dataLoading, handleClick]);

  useEffect(() => {
    if (!chartRef.current) return;
    const observer = new ResizeObserver(() => {
      getInstanceByDom(chartRef.current!)?.resize();
    });
    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flex: '0 0 auto' }}>
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

      {!isLoadingErrorMsg && dataLoading && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            minHeight: 0,
          }}
        >
          <CircularProgress size={24} />
        </Box>
      )}

      {!isLoadingErrorMsg && !dataLoading && !refinedLogs?.length && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            minHeight: 0,
          }}
        >
          <Typography variant="body2" color={Theme.SecondaryMain}>
            No activity in the last 7 days
          </Typography>
        </Box>
      )}

      <div
        ref={chartRef}
        style={{
          width: '100%',
          display: showChart ? 'block' : 'none',
          flex: showChart ? 1 : 0,
          minHeight: 0,
        }}
      />
    </Box>
  );
}

export default memo(RecentActivityChart);
