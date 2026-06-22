import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import {
  type ECElementEvent,
  type ECharts,
  type EChartsOption,
  getInstanceByDom,
  init,
} from 'echarts';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import type { DataTableFilterMeta } from 'primereact/datatable';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { shallowEqual } from 'react-redux';
import { useStableNavigate } from '../../../../app/NavigationContext';
import { selectProjectMetadata } from '../../../../app/projectMetadataSlice';
import { type RootState, useAppSelector } from '../../../../app/store';
import { Theme } from '../../../../assets/themes/theme';
import MetadataLoadingState, { hasCompleteData } from '../../../../constants/metadataLoadingState';
import type { Sample } from '../../../../types/sample.interface';
import type { GenericMetadataWidgetProps } from '../../../../types/widget.props';
import { getWidgetExportName } from '../../../../utilities/fileUtils';
import { updateTabUrlWithSearch } from '../../../../utilities/navigationUtils';
import ChartInfoTooltip from './InfoToolTip';

const STABLE_CAT_FIELD = 'Owner_group';
const STABLE_CAT_FIELD_LABEL = 'Organisation';

const HAS_SEQ = 'Has_sequences';
const ROW_HEIGHT = 45;
const MIN_HEIGHT = 240;
const MAX_HEIGHT = 1200;

const CHART_COLORS = {
  AVAILABLE: Theme.SecondaryMain,
  MISSING: Theme.SecondaryYellow,
} as const;

interface HasSeqWidgetProps extends GenericMetadataWidgetProps {
  categoryField?: string;
}

function stripOwnerSuffix(value: string): string {
  return value.split('-Owner')[0];
}

function HasSeq({
  widgetType,
  identifier,
  filteredData,
  timeFilterObject,
  categoryField,
}: HasSeqWidgetProps) {
  const categoryFieldStable = categoryField ?? STABLE_CAT_FIELD;
  const axisTitleStable = categoryField ?? STABLE_CAT_FIELD_LABEL;

  const { navigate } = useStableNavigate();
  // Ignore organisation level metadata not implemented yet - will need to add a conditional on widget type
  const metadataSelector = useMemo(
    () => (state: RootState) => {
      return selectProjectMetadata(state, identifier);
    },
    [identifier],
  );

  const data = useAppSelector(metadataSelector, shallowEqual);

  const chartRef = useRef<HTMLDivElement>(null);

  const errorMessage = useMemo(() => {
    if (data?.loadingState === MetadataLoadingState.ERROR)
      return data.errorMessage ?? 'Unknown error';
    if (data?.fields && data.fields.length > 0) {
      const fieldNames = data.fields.map((f) => f.columnName);
      if (!fieldNames.includes(categoryFieldStable))
        return `Field ${categoryFieldStable} not found in ${widgetType}`;
      if (!fieldNames.includes(HAS_SEQ)) return `Field ${HAS_SEQ} not found in ${widgetType}`;
    }
    return null;
  }, [data, categoryFieldStable, widgetType]);

  const { categories, availableCounts, missingCounts } = useMemo(() => {
    const availableMap = new Map<string, number>();
    const missingMap = new Map<string, number>();

    for (const sample of filteredData ?? []) {
      const raw = (sample[categoryFieldStable as keyof Sample] as string) ?? '';
      const label = categoryFieldStable === 'Owner_group' ? stripOwnerSuffix(raw) : raw;
      const isAvailable = sample[HAS_SEQ as keyof Sample] === 'True';

      if (isAvailable) {
        availableMap.set(label, (availableMap.get(label) ?? 0) + 1);
      } else {
        missingMap.set(label, (missingMap.get(label) ?? 0) + 1);
      }
    }

    const allLabels = [...new Set([...availableMap.keys(), ...missingMap.keys()])];
    allLabels.sort(
      (a, b) =>
        (availableMap.get(b) ?? 0) +
        (missingMap.get(b) ?? 0) -
        ((availableMap.get(a) ?? 0) + (missingMap.get(a) ?? 0)),
    );

    return {
      categories: allLabels,
      availableCounts: allLabels.map((l) => availableMap.get(l) ?? 0),
      missingCounts: allLabels.map((l) => missingMap.get(l) ?? 0),
    };
  }, [filteredData, categoryFieldStable]);

  const chartHeight = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, categories.length * ROW_HEIGHT));

  const handleClick = useCallback(
    (params: ECElementEvent) => {
      if (!params.seriesName || !params.name) return;
      const isAvailable = params.seriesName === 'Available';
      const rawCategory =
        categoryFieldStable === 'Owner_group' ? `${params.name}-Owner` : params.name;

      const filters: DataTableFilterMeta = {
        [HAS_SEQ]: {
          operator: FilterOperator.AND,
          constraints: [{ matchMode: FilterMatchMode.EQUALS, value: isAvailable }],
        },
        [categoryFieldStable]: {
          operator: FilterOperator.AND,
          constraints: [{ matchMode: FilterMatchMode.EQUALS, value: rawCategory }],
        },
      };

      const combined =
        timeFilterObject && Object.keys(timeFilterObject).length > 0
          ? { ...filters, ...timeFilterObject }
          : filters;

      updateTabUrlWithSearch(navigate, '/samples', combined);
    },
    [categoryFieldStable, timeFilterObject, navigate],
  );

  // Initialise and tear down chart instance
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = init(chartRef.current);
    return () => chart.dispose();
  }, []);

  // Update chart options whenever data changes
  useEffect(() => {
    if (!chartRef.current || errorMessage) return;
    const chart: ECharts = getInstanceByDom(chartRef.current) ?? init(chartRef.current);

    chart.off('click');
    chart.on('click', handleClick);

    const option: EChartsOption = {
      toolbox: {
        feature: {
          saveAsImage: {
            title: 'Export to PNG',
            pixelRatio: 2,
            name: getWidgetExportName('horizontal_bar_chart_has_seq'),
          },
        },
        emphasis: {
          iconStyle: {
            borderColor: Theme.SecondaryMain, // colour on hover (borderColor is weird name for it)
          },
        },
      },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: {
        orient: 'horizontal',
        left: 90,
        bottom: 0,
        icon: 'square',
        itemWidth: 10,
        itemHeight: 10,
        data: ['Available', 'Missing'],
      },
      grid: { right: 90, bottom: 60, top: 16, left: 90 },
      xAxis: { type: 'value', name: 'Count', nameLocation: 'middle', nameGap: 20 },
      yAxis: {
        type: 'category',
        axisLabel: { fontSize: 11 },
        name: axisTitleStable,
        nameLocation: 'middle',
        nameRotate: 90,
        nameGap: 60,
        data: [...categories].reverse(),
      },
      series: [
        {
          cursor: 'pointer',
          emphasis: { focus: 'self', blurScope: 'coordinateSystem' },
          blur: { itemStyle: { opacity: 0.6 } },
          name: 'Available',
          type: 'bar',
          stack: 'total',
          barMaxWidth: 60,
          barCategoryGap: '10%',
          color: CHART_COLORS.AVAILABLE,
          label: { show: true, position: 'inside', color: '#000' },
          data: [...availableCounts].reverse(),
        },
        {
          cursor: 'pointer',
          emphasis: { focus: 'self', blurScope: 'coordinateSystem' },
          blur: { itemStyle: { opacity: 0.6 } },
          name: 'Missing',
          type: 'bar',
          stack: 'total',
          barMaxWidth: 60,
          barCategoryGap: '10%',
          color: CHART_COLORS.MISSING,
          label: { show: true, position: 'inside', color: '#000' },
          data: [...missingCounts].reverse(),
        },
      ],
    };

    chart.setOption(option, true);
  }, [categories, availableCounts, missingCounts, axisTitleStable, errorMessage, handleClick]);

  // Keep chart responsive
  useEffect(() => {
    if (!chartRef.current) return;
    const observer = new ResizeObserver(() => {
      getInstanceByDom(chartRef.current!)?.resize();
    });
    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  const fieldLoaded = hasCompleteData(data?.loadingState);

  return (
    <Box>
      <Typography
        variant="h5"
        paddingBottom={3}
        color="primary"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        Sequence counts
        <ChartInfoTooltip />
      </Typography>

      {errorMessage ? (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {errorMessage}
        </Alert>
      ) : (
        fieldLoaded && <div ref={chartRef} style={{ width: '100%', height: `${chartHeight}px` }} />
      )}

      {!fieldLoaded && <div>Loading...</div>}
    </Box>
  );
}

export default memo(HasSeq);
