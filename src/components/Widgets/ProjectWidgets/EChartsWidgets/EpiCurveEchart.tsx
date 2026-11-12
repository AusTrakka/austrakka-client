import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import * as echarts from 'echarts';
import type { DataTableOperatorFilterMetaData } from 'primereact/datatable';
import { useEffect, useMemo, useRef } from 'react';
import { type OrgMetadataState, selectOrgMetadata } from '../../../../app/orgMetadataSlice';
import {
  type ProjectMetadataState,
  selectProjectMetadata,
} from '../../../../app/projectMetadataSlice';
import { type RootState, useAppSelector } from '../../../../app/store';
import { Theme } from '../../../../assets/themes/theme';
import MetadataLoadingState, { hasCompleteData } from '../../../../constants/metadataLoadingState';
import type { Sample } from '../../../../types/sample.interface';
import { type GenericMetadataWidgetProps, WidgetType } from '../../../../types/widget.props';
import { NULL_COLOUR, resolveColourMap } from '../../../../utilities/colourUtils';
import { formatDate } from '../../../../utilities/dateUtils';
import { getWidgetExportName } from '../../../../utilities/fileUtils';
import { selectGoodTimeBinUnitEchart } from '../../../../utilities/plotUtils';
import ChartInfoTooltip from './InfoToolTip';

const TIME_AXIS_FIELD = 'Date_coll';

const FIELDS_AND_COLOURS: string[][] = [
  ['Jurisdiction', 'jurisdiction'],
  ['State', 'jurisdiction'],
  ['Country', 'tableau10'],
  ['Organisation', 'tableau10'],
];

interface BucketResult {
  bucketKeys: string[];
  fieldValues: string[];
  countsByField: Record<string, number[]>;
}

// Get the start of the bucket or 'offset' buckets after it
function getBucket(d: Date, spec: { unit: string; step: number }, offset = 0): Date {
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();

  switch (spec.unit) {
    case 'day':
      return new Date(y, m, day + offset);
    case 'week': {
      const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
      return new Date(y, m, day + diff + 7 * offset);
    }
    case 'month': {
      const start = Math.floor(m / spec.step) * spec.step;
      return new Date(y, start + spec.step * offset, 1);
    }
    case 'year':
      return new Date(y + offset, 0, 1);
    default:
      return new Date(y, m + offset, 1);
  }
}

function formatBucketLabel(d: Date, timeBinSpec: { unit: string; step: number }): string {
  switch (timeBinSpec.unit) {
    case 'day':
      return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
    case 'week':
      return `Week ${d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    case 'month': {
      if (timeBinSpec.step === 3) {
        const quarter = Math.floor(d.getMonth() / 3) + 1;
        return `Q${quarter} ${d.getFullYear()}`;
      }
      return d.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' });
    }
    case 'year':
      return String(d.getFullYear());
    default:
      return d.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' });
  }
}

interface EpiCurveChartProps extends GenericMetadataWidgetProps {
  preferredColourField?: string;
  dateFilterField: string;
  colourMapping?: Record<string, string> | undefined;
  tall?: boolean;
  alternateTimeAxisField?: string;
}

function EpiCurveEchart(props: EpiCurveChartProps) {
  const {
    widgetType,
    identifier,
    filteredData,
    timeFilterObject,
    dateFilterField,
    tall,
    alternateTimeAxisField,
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

  const data: ProjectMetadataState | OrgMetadataState | null = useAppSelector(metadataSelector);

  const plotDiv = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const errorMessage = useMemo(() => {
    if (
      data?.fields &&
      !data.fields.some((f) => f.columnName === (alternateTimeAxisField ?? TIME_AXIS_FIELD))
    ) {
      return `Field ${alternateTimeAxisField ?? TIME_AXIS_FIELD} not found in ${widgetType}`;
    }
    if (data?.loadingState === MetadataLoadingState.ERROR) {
      return data.errorMessage ?? 'Unknown error';
    }
    return null;
  }, [data?.fields, data?.loadingState, data?.errorMessage, widgetType, alternateTimeAxisField]);

  const timeFilterDescription = useMemo(() => {
    if (timeFilterObject && Object.keys(timeFilterObject).length > 0) {
      const { value } = (timeFilterObject[dateFilterField] as DataTableOperatorFilterMetaData)
        .constraints[0];
      return `${dateFilterField} after ${formatDate(value)}`;
    }
    return 'all time';
  }, [timeFilterObject, dateFilterField]);

  // 4. Bin unit
  const timeBinSpec: { unit: string; step: number } = useMemo(() => {
    if (
      filteredData?.length &&
      data?.fields?.some((f) => f.columnName === (alternateTimeAxisField ?? TIME_AXIS_FIELD))
    ) {
      return selectGoodTimeBinUnitEchart(
        filteredData.map((row: Sample) => row[alternateTimeAxisField ?? TIME_AXIS_FIELD]),
      );
    }
    return { unit: 'week' as const, step: 1 };
  }, [filteredData, data?.fields, alternateTimeAxisField]);

  const colorField = useMemo(() => {
    if (!data?.fields) return null;
    const fieldNames = data.fields.map((f) => f.columnName);
    if (props.preferredColourField && fieldNames.includes(props.preferredColourField)) {
      return props.preferredColourField;
    }
    return FIELDS_AND_COLOURS.find(([field]) => fieldNames.includes(field))?.[0] ?? null;
  }, [data?.fields, props.preferredColourField]);

  const colorSchemeName = useMemo(() => {
    if (!colorField) return null;
    return FIELDS_AND_COLOURS.find(([field]) => field === colorField)?.[1] ?? 'tableau10';
  }, [colorField]);

  const bucketResult = useMemo((): BucketResult | null => {
    if (!filteredData?.length || filteredData?.length === 0) {
      return null;
    }

    const counts = new Map<string, { date: Date; fieldValue: string; count: number }>();
    const allBucketKeys = new Set<string>();
    const allFieldValues = new Set<string>();
    const FLAT_KEY = '_total';

    for (const row of filteredData) {
      const raw = row[alternateTimeAxisField ?? TIME_AXIS_FIELD];
      if (!raw) continue;

      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) continue;

      const bucket = getBucket(d, timeBinSpec);
      const bucketKey = bucket.toISOString();
      const fieldValue = colorField ? String(row[colorField] ?? '') : FLAT_KEY;
      const compositeKey = `${bucketKey}||${fieldValue}`;

      allBucketKeys.add(bucketKey);
      allFieldValues.add(fieldValue);

      const existing = counts.get(compositeKey);
      if (existing) {
        existing.count++;
      } else {
        counts.set(compositeKey, { date: bucket, fieldValue, count: 1 });
      }
    }

    // Include all intermediate buckets even if they have no data
    const sorted = [...allBucketKeys].sort();
    const bucketKeys: string[] = [];
    const last = sorted.length ? new Date(sorted[sorted.length - 1]) : null;
    if (last) {
      for (let d = new Date(sorted[0]); d <= last; d = getBucket(d, timeBinSpec, 1)) {
        bucketKeys.push(d.toISOString());
      }
    }

    const fieldValues = [...allFieldValues].sort();

    const countsByField = Object.fromEntries(
      fieldValues.map((fv) => [fv, bucketKeys.map((bk) => counts.get(`${bk}||${fv}`)?.count ?? 0)]),
    );

    return { bucketKeys, fieldValues, countsByField };
  }, [filteredData, timeBinSpec, colorField, alternateTimeAxisField]);

  const colorMap = useMemo(() => {
    if (!colorField || !colorSchemeName || !bucketResult) return null;
    return resolveColourMap(bucketResult.fieldValues, colorSchemeName, props.colourMapping);
  }, [colorField, colorSchemeName, bucketResult, props.colourMapping]);

  const chartOption = useMemo((): echarts.EChartsOption | null => {
    if (!bucketResult) return null;

    const { bucketKeys, fieldValues, countsByField } = bucketResult;
    const isGrouped = colorField !== null;

    return {
      legend: isGrouped
        ? {
            show: true,
            orient: 'horizontal',
            bottom: 0,
            width: '80%',
            icon: 'square',
            itemWidth: 10,
            itemHeight: 10,
            textStyle: { fontSize: 11 },
            itemGap: 6,
          }
        : { show: false },
      toolbox: {
        feature: {
          saveAsImage: {
            title: 'Export to PNG',
            pixelRatio: 2,
            name: getWidgetExportName('epicurve'),
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
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          if (!isGrouped) {
            return `${params.name}<br/>${params.marker} <strong>${params.value}</strong>`;
          }
          const total = fieldValues.reduce(
            (sum, fv) => sum + (countsByField[fv][params.dataIndex] ?? 0),
            0,
          );
          return `${params.name}<br/>${params.marker}${params.seriesName}: <strong>${params.value}</strong><br/>Total: <strong>${total}</strong>`;
        },
      },
      grid: {
        top: 16,
        right: 80,
        bottom: 80,
        left: 80,
      },
      xAxis: {
        type: 'category',
        data: bucketKeys.map((bk) => formatBucketLabel(new Date(bk), timeBinSpec)),
        axisTick: { show: true, alignWithLabel: true },
        axisLabel: { rotate: 0, hideOverlap: true },
        name: alternateTimeAxisField
          ? `${alternateTimeAxisField}`
          : 'Sample collected date (Date_coll)',
        nameLocation: 'middle',
        nameGap: 30,
      },
      yAxis: {
        type: 'value',
        name: 'Count of samples',
        nameLocation: 'middle',
        nameGap: 40,
        minInterval: 1,
      },
      series: fieldValues.map((fv) => ({
        name: isGrouped ? fv || '(unknown)' : undefined,
        type: 'bar' as const,
        stack: 'total',
        barGap: '0%',
        barCategoryGap: '1px',
        data: countsByField[fv],
        itemStyle: isGrouped
          ? { color: colorMap?.[fv] ?? NULL_COLOUR }
          : { color: Theme.SecondaryDarkGreen },
        ...(!isGrouped && { large: true, largeThreshold: 500 }),
      })),
    };
  }, [bucketResult, colorField, colorMap, timeBinSpec, alternateTimeAxisField]);

  // 7. Init
  useEffect(() => {
    if (!plotDiv.current) return;
    chartInstance.current = echarts.init(plotDiv.current);
    const ro = new ResizeObserver(() => chartInstance.current?.resize());
    ro.observe(plotDiv.current);
    return () => {
      ro.disconnect();
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  // 8. Apply option
  useEffect(() => {
    if (!chartInstance.current) return;
    if (!chartOption || filteredData?.length === 0) {
      chartInstance.current.clear();
      return;
    }
    chartInstance.current.setOption(chartOption, true);
  }, [chartOption, filteredData]);

  return (
    <Box>
      <Typography
        variant="h5"
        paddingBottom={2}
        color="primary"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        {`Samples (${timeFilterDescription})`}
        <ChartInfoTooltip />
      </Typography>

      {errorMessage && (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {errorMessage}
        </Alert>
      )}

      {!hasCompleteData(data?.loadingState) && !errorMessage && <div>Loading...</div>}

      <div
        ref={plotDiv}
        style={{
          width: '100%',
          height: tall ? '474px' : '320px',
          display: hasCompleteData(data?.loadingState) && !errorMessage ? 'block' : 'none',
        }}
      />
    </Box>
  );
}

export default EpiCurveEchart;
