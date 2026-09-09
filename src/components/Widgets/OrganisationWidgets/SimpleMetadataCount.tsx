import { CheckCircle } from '@mui/icons-material';
import ErrorIcon from '@mui/icons-material/Error';
import { Box, CircularProgress, Tooltip, Typography } from '@mui/material';
import { type ECharts, type EChartsOption, getInstanceByDom, init } from 'echarts';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import type { DataTableFilterMeta } from 'primereact/datatable';
import { useEffect, useMemo, useRef } from 'react';
import { shallowEqual } from 'react-redux';
import { useStableNavigate } from '../../../app/NavigationContext';
import { selectOrgMetadata } from '../../../app/orgMetadataSlice';
import { selectProjectMetadata } from '../../../app/projectMetadataSlice';
import { type RootState, useAppSelector } from '../../../app/store';
import { Theme } from '../../../assets/themes/theme';
import MetadataLoadingState, { hasCompleteData } from '../../../constants/metadataLoadingState';
import { type GenericMetadataWidgetProps, WidgetType } from '../../../types/widget.props';
import { countHasSequence, countPresentOrMissing } from '../../../utilities/dataProcessingUtils';
import { updateTabUrlWithSearch } from '../../../utilities/navigationUtils';

const HAS_SEQ_FIELD = 'Has_sequences';

export enum CountMetric {
  MISSING = 'Missing',
  PRESENT = 'Present',
}

interface SimpleCountProps extends GenericMetadataWidgetProps {
  field: string;
  countMetric: CountMetric;
  label: string;
  countWarningLimit?: number;
  infoText?: string;
}

const RING_SIZE = 35;
const MIN_VISIBLE_PERCENTAGE = 5;

export default function SimpleMetadataCount(props: SimpleCountProps) {
  const {
    field,
    widgetType,
    identifier,
    label,
    infoText,
    countWarningLimit,
    countMetric,
    filteredData,
    timeFilterObject,
  } = props;
  const { navigate } = useStableNavigate();
  const chartRef = useRef<HTMLDivElement>(null);

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

  const errorMessage = useMemo(() => {
    if (data?.loadingState === MetadataLoadingState.ERROR)
      return data.errorMessage ?? 'Unknown error';
    if (data?.fields && data.fields.length > 0) {
      const fieldNames = data.fields.map((f) => f.columnName);
      if (!fieldNames.includes(field)) return `Field ${field} not found in ${widgetType}`;
    }
    return null;
  }, [data, widgetType, field]);

  const [{ sampleCount: presentCount }, { sampleCount: missingCount }] =
    field === HAS_SEQ_FIELD
      ? countHasSequence(filteredData)
      : countPresentOrMissing(field, filteredData);

  const count = countMetric === CountMetric.MISSING ? missingCount : presentCount;
  const total = filteredData.length;

  const isZero = count === 0;
  const percentage = total && total > 0 ? (count / total) * 100 : 0;

  const flooredValue = useMemo(() => {
    const p = Math.max(percentage, 0);
    if (p === 0) return 0; // keep true zero as zero
    return Math.max(p, MIN_VISIBLE_PERCENTAGE);
  }, [percentage]);

  // Metadata value drilldown
  const handleClick = (field: string) => {
    const isHasSeq = field === HAS_SEQ_FIELD;
    const value = isHasSeq
      ? countMetric === CountMetric.PRESENT
      : countMetric === CountMetric.MISSING;

    const filters: DataTableFilterMeta = {
      [field]: {
        operator: FilterOperator.AND,
        constraints: [
          {
            matchMode: isHasSeq ? FilterMatchMode.EQUALS : FilterMatchMode.CUSTOM,
            value,
          },
        ],
      },
    };

    // If time filter exists, append to drilldown
    const combined =
      timeFilterObject && Object.keys(timeFilterObject).length > 0
        ? { ...filters, ...timeFilterObject }
        : filters;

    updateTabUrlWithSearch(navigate, '/samples', combined);
  };

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = init(chartRef.current);
    return () => chart.dispose();
  }, []);

  useEffect(() => {
    if (!chartRef.current || isZero) return;
    const chart: ECharts = getInstanceByDom(chartRef.current) ?? init(chartRef.current);

    const option: EChartsOption = {
      tooltip: {
        show: true,
        trigger: 'item',
        appendTo: () => document.body,
        formatter: () => `<b>${label}</b><br/>${count} (${percentage.toFixed(2)}%)`,
      },
      series: [
        {
          type: 'gauge',
          startAngle: 90,
          endAngle: -270,
          min: 0,
          max: 100,
          radius: '100%',
          pointer: { show: false },
          progress: {
            show: true,
            roundCap: true,
            clip: false,
            itemStyle: {
              color:
                countWarningLimit !== undefined && count > countWarningLimit
                  ? Theme.SecondaryYellow
                  : Theme.SecondaryMain,
            },
          },
          axisLine: {
            lineStyle: {
              width: 6,
              color: [[1, Theme.PrimaryGrey200]],
            },
          },
          splitLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
          data: [{ value: flooredValue }],
          detail: {
            show: false,
          },
        },
      ],
    };

    chart.setOption(option, true);
  }, [flooredValue, percentage, label, isZero, countWarningLimit, count]);

  useEffect(() => {
    if (!chartRef.current || isZero) return;
    const observer = new ResizeObserver(() => {
      getInstanceByDom(chartRef.current!)?.resize();
    });
    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, [isZero]);

  const loaded = hasCompleteData(data?.loadingState);

  let content;
  if (errorMessage) {
    content = (
      <ErrorIcon
        sx={{
          width: RING_SIZE + 3,
          height: RING_SIZE + 3,
          color: Theme.SecondaryRed,
          flexShrink: 0,
        }}
      />
    );
  } else if (!loaded) {
    content = <CircularProgress size={RING_SIZE - 5} sx={{ marginBottom: 1, flexShrink: 0 }} />;
  } else {
    content = (
      <Box flexDirection="row" display="flex" gap={1}>
        <Box sx={{ display: 'flex', minWidth: 0 }}>
          <Typography variant="h2">{count}</Typography>
        </Box>
        {isZero ? (
          <CheckCircle
            sx={{
              width: RING_SIZE,
              height: RING_SIZE,
              color: Theme.SecondaryLightGreen,
              flexShrink: 0,
              marginRight: 1,
            }}
          />
        ) : (
          <Box
            ref={chartRef}
            sx={{ width: RING_SIZE, height: RING_SIZE, flexShrink: 0, marginLeft: 1 }}
          />
        )}
      </Box>
    );
  }

  return (
    <Tooltip title={errorMessage ?? infoText ?? ''} placement="bottom" arrow>
      <Box
        onClick={() => handleClick(field)}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          padding: 0.5,
          '&:hover': {
            cursor: 'pointer',
            backgroundColor: Theme.PrimaryGrey50,
          },
          borderRadius: 3,
        }}
      >
        {content}

        <Typography variant="subtitle2" color="textSecondary">
          {label}
        </Typography>
      </Box>
    </Tooltip>
  );
}
