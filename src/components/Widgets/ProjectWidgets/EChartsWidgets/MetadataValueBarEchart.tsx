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
import { selectOrgMetadata } from '../../../../app/orgMetadataSlice';
import { selectProjectMetadata } from '../../../../app/projectMetadataSlice';
import { type RootState, useAppSelector } from '../../../../app/store';
import { Theme } from '../../../../assets/themes/theme';
import MetadataLoadingState, { hasCompleteData } from '../../../../constants/metadataLoadingState';
import { columnStyleRules, styleRules } from '../../../../styles/metadataFieldStyles';
import type { Sample } from '../../../../types/sample.interface';
import { type GenericMetadataWidgetProps, WidgetType } from '../../../../types/widget.props';
import { resolveColourMap } from '../../../../utilities/colourUtils';
import { filterExcluded, isNullOrEmpty } from '../../../../utilities/dataProcessingUtils';
import { getWidgetExportName } from '../../../../utilities/fileUtils';
import { updateTabUrlWithSearch } from '../../../../utilities/navigationUtils';
import ChartInfoTooltip from './InfoToolTip';

const UNKNOWN_VALUE_LABEL = 'unknown'; // label for samples with no value for the category field
const BAR_THICKNESS = 30;

interface MetadataValueBarEchartWidgetProps extends GenericMetadataWidgetProps {
  field: string;
  title?: string | undefined;
  colorScheme?: string | undefined;
  colorMapping?: Record<string, string> | undefined;
  categoryLimit?: number | undefined; // Optional limit for number of categories to show
  exclude?: { field: string; value: string }[] | undefined; // Optional field/value pairs to exclude
  vertical?: boolean | undefined; // Whether to display bar vertically or horizontally
}

function MetadataValueBarEchart(props: MetadataValueBarEchartWidgetProps) {
  const {
    widgetType,
    identifier,
    filteredData = [],
    timeFilterObject,
    field,
    title,
    colorScheme,
    colorMapping,
    categoryLimit,
    exclude,
    vertical = false,
  } = props;

  const { navigate } = useStableNavigate();

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

  // Aggregate counts per category, applying exclude + categoryLimit, same semantics
  // as the old truncateData()/topCategories() pipeline.
  const barData = useMemo(() => {
    let rows: Sample[] = filteredData;
    if (exclude && exclude.length > 0) {
      rows = filterExcluded(rows, exclude);
    }

    const countMap = new Map<string, number>();
    for (const sample of rows) {
      const raw = sample[field as keyof Sample] as string | null | undefined;
      const key = isNullOrEmpty(raw) ? '' : (raw as string);
      countMap.set(key, (countMap.get(key) ?? 0) + 1);
    }

    let entries = [...countMap.entries()].sort((a, b) => b[1] - a[1]);

    if (categoryLimit) {
      // categoryLimit historically excludes empty/null categories from the "top N"
      entries = entries.filter(([name]) => name !== '');
      entries = entries.slice(0, categoryLimit);
    }

    return entries.map(([name, value]) => ({ name, value }));
  }, [filteredData, field, exclude, categoryLimit]);

  const colorMap = useMemo(() => {
    if (errorMessage) return {};
    const values = barData.map((item) => item.name);

    if (colorMapping) {
      return resolveColourMap(values, 'tableau10', colorMapping);
    }

    return resolveColourMap(values, colorScheme ?? 'tableau10');
  }, [barData, colorScheme, colorMapping, errorMessage]);

  const handleClick = useCallback(
    (params: ECElementEvent) => {
      if (params.seriesName === undefined) return;
      const isNull = params.seriesName === UNKNOWN_VALUE_LABEL;
      const filters: DataTableFilterMeta = {
        [field]: {
          operator: FilterOperator.AND,
          constraints: [
            isNull
              ? { matchMode: FilterMatchMode.CUSTOM, value: true }
              : { matchMode: FilterMatchMode.EQUALS, value: params.seriesName },
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

    // Single fixed slot — there's only ever one bar made up of stacked segments
    const categoryAxis = {
      type: 'category' as const,
      data: [field],
      axisLabel: { show: false },
      axisTick: { show: false },
    };
    const valueAxis = {
      type: 'value' as const,
      name: 'Count',
      nameLocation: 'middle' as const,
      nameGap: 28,
    };

    chart.setOption(
      {
        toolbox: {
          feature: {
            saveAsImage: {
              title: 'Export to PNG',
              pixelRatio: 2,
              name: getWidgetExportName('barchart'),
            },
          },
          emphasis: {
            iconStyle: {
              borderColor: Theme.SecondaryMain,
            },
          },
        },
        tooltip: {
          trigger: 'item',
          appendTo: () => document.body,
          formatter: (params) => {
            const p = Array.isArray(params) ? params[0] : params;
            return `<span class="${p.seriesName !== UNKNOWN_VALUE_LABEL ? columnStyleRules[field] : ''}">${p.seriesName}</span>: ${p.value}`;
          },
        },
        legend: {
          orient: 'horizontal',
          width: '100%',
          bottom: 0,
          icon: 'square',
          itemWidth: 10,
          itemHeight: 10,
          data: barData.map((item) => item.name || UNKNOWN_VALUE_LABEL),
          textStyle: {
            fontSize: 10,
            rich: {
              italic: { fontStyle: 'italic', fontSize: 10 },
            },
          },
          formatter: (name: string) => {
            const isItalic = columnStyleRules[field] === styleRules.italic;
            return isItalic && name !== UNKNOWN_VALUE_LABEL ? `{italic|${name}}` : name;
          },
        },
        grid: vertical
          ? { left: 'center', right: 40, width: BAR_THICKNESS, top: 10, bottom: 90 }
          : { left: 0, right: 50, height: BAR_THICKNESS, top: 'center' },
        xAxis: vertical ? categoryAxis : valueAxis,
        yAxis: vertical ? valueAxis : categoryAxis,
        series: barData.map((item) => ({
          type: 'bar' as const,
          name: item.name || UNKNOWN_VALUE_LABEL,
          stack: 'total',
          cursor: 'pointer',
          barWidth: BAR_THICKNESS,
          emphasis: {
            itemStyle: { shadowBlur: 8, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.3)' },
          },
          itemStyle: { color: colorMap[item.name] },
          data: [item.value],
        })),
      } satisfies EChartsOption,
      true,
    );
  }, [barData, colorMap, errorMessage, infoMessage, handleClick, field, vertical]);

  useEffect(() => {
    if (!chartRef.current) return;
    const observer = new ResizeObserver(() => getInstanceByDom(chartRef.current!)?.resize());
    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  const canRender = !errorMessage && !infoMessage && hasCompleteData(data?.loadingState);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {title !== '' && (
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
      )}

      {errorMessage && (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {errorMessage}
        </Alert>
      )}

      {infoMessage && <Alert severity="info">{infoMessage}</Alert>}

      {!hasCompleteData(data?.loadingState) && !errorMessage && <div>Loading...</div>}

      {canRender && (
        <div ref={chartRef} style={{ width: '100%', height: '100%', minHeight: '280px' }} />
      )}
    </Box>
  );
}

export default memo(MetadataValueBarEchart);
