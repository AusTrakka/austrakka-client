import { Box, Tooltip, Typography } from '@mui/material';
import { type ECharts, type EChartsOption, getInstanceByDom, init } from 'echarts';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import type { DataTableFilterMeta } from 'primereact/datatable';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useStableNavigate } from '../../../app/NavigationContext';
import { selectOrgMetadata } from '../../../app/orgMetadataSlice';
import { selectProjectMetadata } from '../../../app/projectMetadataSlice';
import { type RootState, useAppSelector } from '../../../app/store';
import { Theme } from '../../../assets/themes/theme';
import { hasCompleteData } from '../../../constants/metadataLoadingState';
import type { Sample } from '../../../types/sample.interface';
import { type GenericMetadataWidgetProps, WidgetType } from '../../../types/widget.props';
import { resolveColourMap } from '../../../utilities/colourUtils';
import { isNullOrEmpty } from '../../../utilities/dataProcessingUtils';
import { updateTabUrlWithSearch } from '../../../utilities/navigationUtils';

// This is a simple single-bar bar chart that shows a breakdown of a single metadata field for a set of samples.
// It currently show no legend, but does provide a detailed hover tooltip breakdown.

const UNKNOWN_VALUE_LABEL = 'unknown'; // label for samples with no value for the category field
const BAR_THICKNESS = 20;
const NO_DATA_LABEL = 'No data';
const NO_DATA_COLOR = Theme.PrimaryGrey300; // color for the "No data" segment

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
  const [hintOpen, setHintOpen] = useState(false);
  const chartInstanceId = useId();
  const { navigate } = useStableNavigate();

  const isHasSeq = field === HAS_SEQ;
  const isSharedGroups = field === SHARED_GROUPS_FIELD;

  // Aggregate counts per category for this field
  const barData = useMemo(() => {
    if (!data?.metadata || data.metadata.length === 0) {
      // If there is no data, return a single segment with a "No data" label
      return [{ name: NO_DATA_LABEL, value: 1 }];
    }
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
  }, [filteredData, field, isHasSeq, isSharedGroups, data]);

  const colorMap = useMemo(() => {
    if (barData.length === 1 && barData[0].name === NO_DATA_LABEL) {
      return { [NO_DATA_LABEL]: NO_DATA_COLOR };
    }
    const values = barData.map((item) => item.name);
    if (colorMapping) return resolveColourMap(values, colorScheme ?? 'tableau10', colorMapping);
    return resolveColourMap(values, colorScheme ?? 'tableau10');
  }, [barData, colorScheme, colorMapping]);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = init(chartRef.current);
    return () => chart.dispose();
  }, []);

  const handleClick = useCallback(
    (segmentName: string) => {
      if (segmentName === NO_DATA_LABEL) return; // Do not navigate if the user clicks on the "No data" segment

      let filters: DataTableFilterMeta;
      // Special handling for Has_sequences/Shared_groups fields
      if (isHasSeq || isSharedGroups) {
        const trueLabel = isHasSeq ? 'Available' : 'Not shared';
        filters = {
          [field]: {
            operator: FilterOperator.AND,
            constraints: [
              {
                matchMode: isSharedGroups ? FilterMatchMode.CUSTOM : FilterMatchMode.EQUALS,
                value: segmentName === trueLabel ? 'True' : 'False',
              },
            ],
          },
        };
      } else {
        // Default handling for remaining metadata fields
        filters = {
          [field]: {
            operator: FilterOperator.AND,
            constraints: [
              {
                matchMode: FilterMatchMode.EQUALS,
                value: segmentName,
              },
            ],
          },
        };
      }
      updateTabUrlWithSearch(navigate, '/samples', filters);
    },
    [field, isHasSeq, navigate, isSharedGroups],
  );

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
          triggerOn: 'click',
          axisPointer: { type: 'shadow' },
          appendToBody: true,
          enterable: true,
          confine: false,
          position: (point, _params, _dom, _rect, size) => {
            const [tooltipWidth] = size.contentSize;
            return [point[0] - tooltipWidth / 2, point[1] + 8];
          },
          formatter: (params: any) => {
            if (params.length === 1 && params[0].seriesName === NO_DATA_LABEL) {
              return `<strong>${title ?? 'Breakdown'}</strong><br/>No data available`;
            }
            const total = data?.metadata?.length ?? filteredData.length;
            const rows = params
              .filter((p: any) => p.value > 0)
              .map((p: any) => {
                const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : '0.0';
                return `
                  <div
                    bar-chart-segment-name="${encodeURIComponent(p.seriesName)}"
                    bar-chart-instance-id="${chartInstanceId}"
                    style="cursor:pointer; padding:3px 4px; border-radius:16px; display:flex; justify-content:space-between; gap:12px;"
                    onmouseover="this.style.background='rgba(0,0,0,0.1)'"
                    onmouseout="this.style.background='transparent'"
                  >
                    <span>${p.marker} ${p.seriesName}</span>
                    <span><strong>${p.value}</strong> (${pct}%)</span>
                  </div>
                `;
              })
              .join('');

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
            cursor: item.value > 0 ? 'pointer' : 'default',
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
  }, [
    barData,
    colorMap,
    field,
    title,
    data?.metadata?.length,
    filteredData.length,
    chartInstanceId,
  ]);

  // Listener for clicks on individual tooltip rows
  useEffect(() => {
    const handleTooltipClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('[bar-chart-segment-name]');
      if (!target) return;
      if (target.getAttribute('bar-chart-instance-id') !== chartInstanceId) return;
      const name = decodeURIComponent(target.getAttribute('bar-chart-segment-name')!);
      handleClick(name);

      // Hide the tooltip after clicking a row
      let node: HTMLElement | null = target as HTMLElement;
      while (node && node.parentElement !== document.body) {
        node = node.parentElement;
      }
      if (node) node.style.display = 'none';

      if (chartRef.current) {
        const chart = getInstanceByDom(chartRef.current);
        chart?.dispatchAction({ type: 'hideTip' });
      }
    };
    document.addEventListener('click', handleTooltipClick);
    return () => document.removeEventListener('click', handleTooltipClick);
  }, [chartInstanceId, handleClick]);

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
        <Tooltip
          title="Click to view breakdown"
          open={hintOpen}
          onOpen={() => setHintOpen(true)}
          onClose={() => setHintOpen(false)}
          disableInteractive
          arrow
          followCursor
          slotProps={{
            popper: {
              modifiers: [{ name: 'offset', options: { offset: [0, 14] } }],
            },
          }}
        >
          <div ref={chartRef} style={{ width: '100%', height: `calc(${BAR_THICKNESS}px + 5px)` }} />
        </Tooltip>
      )}
    </Box>
  );
}

export default SimpleMetadataBarChart;
