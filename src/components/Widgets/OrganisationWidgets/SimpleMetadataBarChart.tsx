import { Box, Typography } from '@mui/material';
import { type ECharts, type EChartsOption, getInstanceByDom, init } from 'echarts';
import { useEffect, useMemo, useRef } from 'react';
import { shallowEqual } from 'react-redux';
import { selectOrgMetadata } from '../../../app/orgMetadataSlice';
import { selectProjectMetadata } from '../../../app/projectMetadataSlice';
import { type RootState, useAppSelector } from '../../../app/store';
import { hasCompleteData } from '../../../constants/metadataLoadingState';
import type { Sample } from '../../../types/sample.interface';
import { type GenericMetadataWidgetProps, WidgetType } from '../../../types/widget.props';
import { resolveColourMap } from '../../../utilities/colourUtils';
import { isNullOrEmpty } from '../../../utilities/dataProcessingUtils';

// This is a simple single-bar bar chart that shows a breakdown of a single metadata field for a set of samples.
// It currently show no legend, but does provide a detailed hover tooltip breakdown.

const UNKNOWN_VALUE_LABEL = 'unknown'; // label for samples with no value for the category field
const BAR_THICKNESS = 20;

// Fields that need bespoke bucketing instead of "count each distinct raw value"
const HAS_SEQ = 'Has_sequences';
const SHARED_GROUPS_FIELD = 'Shared_groups';
const GROUP_SUFFIX = '-Group';
const UNSHARED_VALUE = 'Not shared'; // label for samples with no value for the category field

interface SimpleMetadataBarChartProps extends GenericMetadataWidgetProps {
  field: string;
  title?: string;
  colorScheme?: string;
  colorMapping?: Record<string, string>;
}

function SimpleMetadataBarChart(props: SimpleMetadataBarChartProps) {
  const {
    widgetType,
    identifier,
    filteredData = [],
    field,
    title,
    colorScheme,
    colorMapping,
  } = props;

  const metadataSelector = useMemo(
    () => (state: RootState) => {
      switch (widgetType) {
        case WidgetType.Organisation:
          return selectOrgMetadata(state, identifier);
        case WidgetType.Project:
          return selectProjectMetadata(state, identifier);
        default:
          throw new Error(`This widget is not supported for widget type: ${widgetType}`);
      }
    },
    [identifier, widgetType],
  );
  const data = useAppSelector(metadataSelector, shallowEqual);
  const chartRef = useRef<HTMLDivElement>(null);

  const isHasSeq = field === HAS_SEQ;
  const isSharedGroups = field === SHARED_GROUPS_FIELD;

  // Aggregate counts per category for this field
  const barData = useMemo(() => {
    if (isHasSeq) {
      let available = 0;
      let missing = 0;
      for (const sample of filteredData) {
        const hasSeq = sample[field as keyof Sample];
        if (hasSeq === 'True') available += 1;
        else missing += 1;
      }
      return [
        { name: 'Available', value: available },
        { name: 'Missing', value: missing },
      ];
    }
    if (isSharedGroups) {
      let shared = 0;
      let notShared = 0;
      for (const sample of filteredData) {
        const sharedGroups = sample[SHARED_GROUPS_FIELD as keyof Sample];

        if (isNullOrEmpty(sharedGroups as string | null | undefined)) {
          notShared += 1;
          continue;
        }

        let groups: string[] = [];
        try {
          groups = JSON.parse(sharedGroups as string);
        } catch {
          notShared += 1;
          continue;
        }

        const hasGroup = groups.some((group) => group.endsWith(GROUP_SUFFIX));
        if (hasGroup) shared += 1;
        else notShared += 1;
      }
      return [
        { name: 'Shared', value: shared },
        { name: UNSHARED_VALUE, value: notShared },
      ];
    }

    const countMap = new Map<string, number>();
    for (const sample of filteredData) {
      const value = sample[field as keyof Sample] as string | null | undefined;
      const key = isNullOrEmpty(value) ? UNKNOWN_VALUE_LABEL : (value as string);

      countMap.set(key, (countMap.get(key) ?? 0) + 1);
    }
    return [...countMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [filteredData, field, isHasSeq, isSharedGroups]);

  const colorMap = useMemo(() => {
    const values = barData.map((item) => item.name);
    if (colorMapping) return resolveColourMap(values, colorScheme ?? 'tableau10', colorMapping);
    return resolveColourMap(values, colorScheme ?? 'tableau10');
  }, [barData, colorScheme, colorMapping]);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = init(chartRef.current);
    return () => chart.dispose();
  }, []);

  useEffect(() => {
    if (!chartRef.current || barData.length === 0) return;
    const chart: ECharts = getInstanceByDom(chartRef.current) ?? init(chartRef.current);
    // Find the last segment that will actually render (non-zero value)
    let lastVisibleIndex = -1;
    for (let i = barData.length - 1; i >= 0; i--) {
      if (barData[i].value > 0) {
        lastVisibleIndex = i;
        break;
      }
    }

    chart.setOption(
      {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          appendToBody: true,
          formatter: (params: any) => {
            const total = data?.metadata?.length ?? filteredData.length;

            const rows = params
              .map((p: any) => {
                const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : '0.0';
                return `${p.marker} ${p.seriesName}: ${p.value} (${pct}%)`;
              })
              .join('<br/>');
            return `<strong>${title ?? 'Breakdown'}</strong><br/>${rows}<br/> Total: ${total}`;
          },
        },
        grid: { left: 0, right: 0, top: 0, bottom: 0 },
        xAxis: { type: 'value', show: false },
        yAxis: {
          type: 'category',
          data: [field],
          axisLabel: { show: false },
          axisTick: { show: false },
          axisLine: { show: false },
        },
        series: barData.map((item, index) => ({
          type: 'bar' as const,
          name: item.name,
          stack: 'total',
          barWidth: BAR_THICKNESS,
          label: { show: false },
          itemStyle: {
            color: colorMap[item.name],
            borderRadius: [
              0,
              index === lastVisibleIndex ? 10 : 0,
              index === lastVisibleIndex ? 10 : 0,
              0,
            ],
          },
          data: [item.value],
        })),
      } satisfies EChartsOption,
      true,
    );
  }, [barData, colorMap, field, title, data?.metadata?.length, filteredData.length]);

  useEffect(() => {
    if (!chartRef.current) return;
    const observer = new ResizeObserver(() => getInstanceByDom(chartRef.current!)?.resize());
    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  const canRender = barData.length > 0 && hasCompleteData(data?.loadingState);

  return (
    <Box>
      {title && (
        <Typography variant="body2" color="primary">
          {title}
        </Typography>
      )}
      {!hasCompleteData(data?.loadingState) && <div>Loading...</div>}
      {canRender && (
        <div ref={chartRef} style={{ width: '100%', height: `calc(${BAR_THICKNESS}px + 5px)` }} />
      )}
    </Box>
  );
}

export default SimpleMetadataBarChart;
