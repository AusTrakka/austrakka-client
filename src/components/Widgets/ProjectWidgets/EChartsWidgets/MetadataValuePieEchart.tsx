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
import type GenericWidgetProps from '../../../../types/genericwidget.props';
import type { Sample } from '../../../../types/sample.interface';
import { resolveColourMap } from '../../../../utilities/colourUtils';
import { isNullOrEmpty } from '../../../../utilities/dataProcessingUtils';
import { getWidgetExportName } from '../../../../utilities/fileUtils';
import { updateTabUrlWithSearch } from '../../../../utilities/navigationUtils';
import ChartInfoTooltip from './InfoToolTip';

interface MetadataValueEchartWidgetProps extends GenericWidgetProps {
  field: string;
  title?: string | undefined;
  colorScheme?: string | undefined;
  colorMapping?: Record<string, string> | undefined;
}

function MetadataValuePieEchart(props: MetadataValueEchartWidgetProps) {
  const {
    widgetType,
    identifier,
    filteredData = [],
    timeFilterObject,
    field,
    title,
    colorScheme,
    colorMapping,
  } = props;

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
    if (colorScheme && colorMapping) return 'Widget Setup Error';
    if (data?.loadingState === MetadataLoadingState.ERROR)
      return data.errorMessage ?? 'Unknown error';
    return null;
  }, [data, colorScheme, colorMapping]);

  const infoMessage = useMemo(() => {
    if (data?.fields && data.fields.length > 0) {
      const fieldNames = data.fields.map((f) => f.columnName);
      if (!fieldNames.includes(field))
        return `Field ${field} not found in ${widgetType}. Add this field to the ${widgetType} to see data.`;
    }
    return null;
  }, [data, field, widgetType]);

  const pieData = useMemo(() => {
    const countMap = new Map<string, number>();
    for (const sample of filteredData) {
      const raw = sample[field as keyof Sample] as string | null | undefined;
      const key = isNullOrEmpty(raw) ? '' : (raw as string);
      countMap.set(key, (countMap.get(key) ?? 0) + 1);
    }
    return [...countMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [filteredData, field]);

  const colorMap = useMemo(() => {
    if (errorMessage) return {};
    const values = pieData.map((item) => item.name);

    if (colorMapping) {
      return resolveColourMap(values, 'tableau10', colorMapping);
    }

    return resolveColourMap(values, colorScheme ?? 'tableau10');
  }, [pieData, colorScheme, colorMapping, errorMessage]);

  const handleClick = useCallback(
    (params: ECElementEvent) => {
      if (params.name === undefined) return;
      const isNull = params.name === '';
      const filters: DataTableFilterMeta = {
        [field]: {
          operator: FilterOperator.AND,
          constraints: [
            isNull
              ? { matchMode: FilterMatchMode.CUSTOM, value: true }
              : { matchMode: FilterMatchMode.EQUALS, value: params.name },
          ],
        },
      };
      const combined =
        timeFilterObject && Object.keys(timeFilterObject).length > 0
          ? { ...filters, ...timeFilterObject }
          : filters;
      updateTabUrlWithSearch(navigate, '/samples', combined);
    },
    [field, timeFilterObject, navigate],
  );

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = init(chartRef.current);
    return () => chart.dispose();
  }, []);

  useEffect(() => {
    if (!chartRef.current || errorMessage || infoMessage) return;
    const chart: ECharts = getInstanceByDom(chartRef.current) ?? init(chartRef.current);
    chart.off('click');
    chart.on('click', handleClick);
    chart.setOption(
      {
        toolbox: {
          feature: {
            saveAsImage: {
              title: 'Export to PNG',
              pixelRatio: 2,
              name: getWidgetExportName('piechart'),
            },
          },
          emphasis: {
            iconStyle: {
              borderColor: Theme.SecondaryMain,
            },
          },
        },
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: {
          orient: 'horizontal',
          width: '100%',
          bottom: 0,
          icon: 'square',
          itemWidth: 10,
          itemHeight: 10,
          textStyle: { fontSize: 10 },
        },
        series: [
          {
            type: 'pie',
            radius: ['30%', '65%'],
            center: ['50%', '40%'],
            cursor: 'pointer',
            label: { show: true, formatter: '{d}%', fontSize: 11, color: '#000' },
            labelLine: { show: true },
            emphasis: {
              itemStyle: { shadowBlur: 8, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.3)' },
            },
            data: pieData.map((item) => ({
              name: item.name || 'unknown',
              value: item.value,
              itemStyle: { color: colorMap[item.name] },
            })),
          },
        ],
      } satisfies EChartsOption,
      true,
    );
  }, [pieData, colorMap, errorMessage, infoMessage, handleClick]);

  useEffect(() => {
    if (!chartRef.current) return;
    const observer = new ResizeObserver(() => getInstanceByDom(chartRef.current!)?.resize());
    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  const canRender = !errorMessage && !infoMessage && hasCompleteData(data?.loadingState);

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
        {title ?? `${field} counts`}
        <ChartInfoTooltip
          text={`${field} values \n Click legend items to show/hide · Hover for details`}
        />
      </Typography>

      {errorMessage && (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {errorMessage}
        </Alert>
      )}

      {infoMessage && <Alert severity="info">{infoMessage}</Alert>}

      {!hasCompleteData(data?.loadingState) && !errorMessage && <div>Loading...</div>}

      {canRender && <div ref={chartRef} style={{ width: '100%', minHeight: '280px' }} />}
    </Box>
  );
}

export default memo(MetadataValuePieEchart);
