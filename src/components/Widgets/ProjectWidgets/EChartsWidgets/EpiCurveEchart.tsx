import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import * as echarts from 'echarts';
import type { DataTableOperatorFilterMetaData } from 'primereact/datatable';
import { useEffect, useMemo, useRef } from 'react';
import {
  type ProjectMetadataState,
  selectProjectMetadata,
} from '../../../../app/projectMetadataSlice';
import { useAppSelector } from '../../../../app/store';
import { Theme } from '../../../../assets/themes/theme';
import MetadataLoadingState, { hasCompleteData } from '../../../../constants/metadataLoadingState';
import type { Sample } from '../../../../types/sample.interface';
import { NULL_COLOUR, resolveColourMap } from '../../../../utilities/colourUtils';
import { formatDate } from '../../../../utilities/dateUtils';
import { getWidgetExportName } from '../../../../utilities/fileUtils';
import { selectGoodTimeBinUnitEchart } from '../../../../utilities/plotUtils';
import type { EpiCurveChartProps } from '../EpiCurveChart';

const TIME_AXIS_FIELD = 'Date_coll';

const FIELDS_AND_COLOURS: string[][] = [
  ['Jurisdiction', 'jurisdiction'],
  ['State', 'jurisdiction'],
  ['Country', 'tableau10'],
  ['Owner_group', 'tableau10'],
];

interface BucketResult {
  bucketKeys: string[];
  fieldValues: string[];
  countsByField: Record<string, number[]>;
}

function getBucketStart(d: Date, timeBinSpec: { unit: string; step: number }): Date {
  switch (timeBinSpec.unit) {
    case 'day':
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    case 'week': {
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
    }
    case 'month': {
      const month = Math.floor(d.getMonth() / timeBinSpec.step) * timeBinSpec.step;
      return new Date(d.getFullYear(), month, 1);
    }
    case 'year':
      return new Date(d.getFullYear(), 0, 1);
    default:
      return new Date(d.getFullYear(), d.getMonth(), 1);
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

function EpiCurveEchart(props: EpiCurveChartProps) {
  const { projectAbbrev, filteredData, timeFilterObject, dateFilterField, tall } = props;
  const data: ProjectMetadataState | null = useAppSelector((state) =>
    selectProjectMetadata(state, projectAbbrev),
  );

  const plotDiv = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const errorMessage = useMemo(() => {
    if (data?.fields && !data.fields.some((f) => f.columnName === TIME_AXIS_FIELD)) {
      return `Field ${TIME_AXIS_FIELD} not found in project`;
    }
    if (data?.loadingState === MetadataLoadingState.ERROR) {
      return data.errorMessage ?? 'Unknown error';
    }
    return null;
  }, [data?.fields, data?.loadingState, data?.errorMessage]);

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
    if (filteredData?.length && data?.fields?.some((f) => f.columnName === TIME_AXIS_FIELD)) {
      return selectGoodTimeBinUnitEchart(filteredData.map((row: Sample) => row[TIME_AXIS_FIELD]));
    }
    return { unit: 'week' as const, step: 1 };
  }, [filteredData, data?.fields]);

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
      const raw = row[TIME_AXIS_FIELD];
      if (!raw) continue;

      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) continue;

      const bucket = getBucketStart(d, timeBinSpec);
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

    const bucketKeys = [...allBucketKeys].sort();
    const fieldValues = [...allFieldValues].sort();

    const countsByField = Object.fromEntries(
      fieldValues.map((fv) => [fv, bucketKeys.map((bk) => counts.get(`${bk}||${fv}`)?.count ?? 0)]),
    );

    return { bucketKeys, fieldValues, countsByField };
  }, [filteredData, timeBinSpec, colorField]);

  const colorMap = useMemo(() => {
    if (!colorField || !colorSchemeName || !bucketResult) return null;
    return resolveColourMap(bucketResult.fieldValues, colorSchemeName, props.colourMapping);
  }, [colorField, colorSchemeName, bucketResult, props.colourMapping]);

  const chartOption = useMemo((): echarts.EChartsOption | null => {
    if (!bucketResult) return null;

    const { bucketKeys, fieldValues, countsByField } = bucketResult;
    const isGrouped = colorField !== null;
    // ifGroupsed

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
          const item = Array.isArray(params) ? params[0] : params;
          const label = formatBucketLabel(new Date(item.value[0]), timeBinSpec);

          if (!isGrouped) {
            return `${label}<br/>${item.marker} <strong>${item.value[1]}</strong>`;
          }

          const bucketIndex = bucketResult.bucketKeys.findIndex(
            (bk) => new Date(bk).getTime() === item.value[0],
          );
          const total = bucketResult.fieldValues.reduce(
            (sum, fv) => sum + (bucketResult.countsByField[fv][bucketIndex] ?? 0),
            0,
          );

          return `${label}<br/>${item.marker}${item.seriesName}: <strong>${item.value[1]}</strong><br/>Total: <strong>${total}</strong>`;
        },
      },
      grid: {
        top: 16,
        right: 80,
        bottom: 80,
        left: 80,
      },
      xAxis: {
        type: 'time',
        axisLabel: {
          formatter: (value: number) => formatBucketLabel(new Date(value), timeBinSpec),
          rotate: 0,
          hideOverlap: true,
        },
        name: 'Sample collected date (Date_coll)',
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
        data: countsByField[fv].map((count, i) => [new Date(bucketKeys[i]).getTime(), count]),
        itemStyle: isGrouped
          ? { color: colorMap?.[fv] ?? NULL_COLOUR }
          : { color: Theme.SecondaryDarkGreen },
        emphasis: { focus: isGrouped ? 'series' : 'self' },
        ...(!isGrouped && { large: true, largeThreshold: 500 }),
      })),
    };
  }, [bucketResult, colorField, colorMap, timeBinSpec]);

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
      <Typography variant="h5" paddingBottom={2} color="primary">
        {`Samples (${timeFilterDescription})`}
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
