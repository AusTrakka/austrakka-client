import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Alert, AlertTitle, Box, Chip, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import {
  type ECElementEvent,
  type ECharts,
  type EChartsOption,
  getInstanceByDom,
  init,
} from 'echarts';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import type { DataTableFilterMeta } from 'primereact/datatable';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { useStableNavigate } from '../../../../app/NavigationContext';
import { selectOrgMetadata } from '../../../../app/orgMetadataSlice';
import { selectProjectMetadata } from '../../../../app/projectMetadataSlice';
import { type RootState, useAppSelector } from '../../../../app/store';
import { Theme } from '../../../../assets/themes/theme';
import MetadataLoadingState, { hasCompleteData } from '../../../../constants/metadataLoadingState';
import { columnStyleRules, styleRules } from '../../../../styles/metadataFieldStyles';
import { type GenericMetadataWidgetProps, WidgetType } from '../../../../types/widget.props';
import { OTHER_COLOUR, resolveColourMap } from '../../../../utilities/colourUtils';
import { topCategories } from '../../../../utilities/dataProcessingUtils';
import { getWidgetExportName } from '../../../../utilities/fileUtils';
import { updateTabUrlWithSearch } from '../../../../utilities/navigationUtils';
import ChartInfoTooltip from './InfoToolTip';

const UNKNOWN_VALUE_LABEL = 'unknown'; // label for samples with no value for the category field

interface PieDataItem {
  name: string;
  value: number;
  otherCategories?: string[];
}

interface MetadataValueEchartWidgetProps extends GenericMetadataWidgetProps {
  field: string;
  title?: string | undefined;
  colorScheme?: string | undefined;
  colorMapping?: Record<string, string> | undefined;
  categoryLimit?: number | undefined; // Optional limit for number of top categories to show
  categoryLimitOptions?: number[] | undefined; // For rendering user changeable limit
  hideOtherCategory?: boolean; // If category limit is set, choose to hide or show other category
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
    categoryLimit,
    categoryLimitOptions,
    hideOtherCategory,
  } = props;

  const { navigate } = useStableNavigate();
  const [limitMenuAnchor, setLimitMenuAnchor] = useState<HTMLElement | null>(null);

  const [categoryLimitState, setCategoryLimitState] = useState(categoryLimit ?? undefined);

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

  const { pieData, isTruncated } = useMemo((): { pieData: PieDataItem[]; isTruncated: boolean } => {
    const result = topCategories(filteredData, field, categoryLimitState, true);

    const items: PieDataItem[] = result.categories.map(({ category, count }) => ({
      name: category,
      value: count,
    }));

    if (result.other && !hideOtherCategory) {
      items.push({
        name: 'Other',
        value: result.other.count,
        otherCategories: result.other.categories,
      });
    }

    return { pieData: items, isTruncated: Boolean(result.other) };
  }, [filteredData, field, categoryLimitState, hideOtherCategory]);

  const colorMap = useMemo((): Record<string, string> => {
    if (errorMessage) return {};
    const values = pieData.map((item) => item.name);

    const baseMap = colorMapping
      ? resolveColourMap(values, 'tableau10', colorMapping)
      : resolveColourMap(values, colorScheme ?? 'tableau10');

    return { ...baseMap, Other: OTHER_COLOUR };
  }, [pieData, colorScheme, colorMapping, errorMessage]);

  const handleClick = useCallback(
    (params: ECElementEvent) => {
      if (params.name === undefined) return;
      const isNull = params.name === UNKNOWN_VALUE_LABEL || params.name === '';
      const isOther = params.name === 'Other';

      const clickedItem =
        pieData.find((d) => d.name === (isNull ? '' : params.name)) ??
        pieData.find((d) => d.name === 'Other');

      let constraint: { matchMode: FilterMatchMode; value: unknown };
      if (isOther) {
        constraint = { matchMode: FilterMatchMode.IN, value: clickedItem?.otherCategories ?? [] };
      } else if (isNull) {
        constraint = { matchMode: FilterMatchMode.CUSTOM, value: true };
      } else {
        constraint = { matchMode: FilterMatchMode.EQUALS, value: params.name };
      }

      const filters: DataTableFilterMeta = {
        [field]: {
          operator: FilterOperator.AND,
          constraints: [constraint],
        },
      };
      const combined =
        timeFilterObject && Object.keys(timeFilterObject).length > 0
          ? { ...filters, ...timeFilterObject }
          : filters;
      updateTabUrlWithSearch(navigate, '/samples', combined);
    },
    [field, timeFilterObject, navigate, pieData],
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
        tooltip: {
          trigger: 'item',
          appendTo: () => document.body,
          formatter: (params) => {
            const p = Array.isArray(params) ? params[0] : params;
            return `<span class="${p.name !== UNKNOWN_VALUE_LABEL ? columnStyleRules[field] : ''}">${p.name}</span>: ${p.value} (${p.percent}%)`;
          },
        },
        legend: {
          orient: 'horizontal',
          width: '100%',
          bottom: 0,
          icon: 'square',
          itemWidth: 10,
          itemHeight: 10,
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
        series: [
          {
            type: 'pie',
            radius: ['30%', '65%'],
            center: ['50%', '40%'],
            cursor: 'pointer',
            avoidLabelOverlap: true,
            label: {
              show: true,
              formatter: '{d}%',
              fontSize: 11,
              color: Theme.PrimaryGrey900,
              alignTo: 'edge',
              edgeDistance: 20,
              width: 90, // forces wrapping/truncation instead of unbounded text width
            },
            labelLayout: {},
            emphasis: {
              itemStyle: { shadowBlur: 8, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.3)' },
            },
            data: pieData.map((item) => ({
              name: item.name || UNKNOWN_VALUE_LABEL,
              value: item.value,
              itemStyle: { color: colorMap[item.name] },
            })),
          },
        ],
      } satisfies EChartsOption,
      true,
    );
  }, [pieData, colorMap, errorMessage, infoMessage, handleClick, field]);

  useEffect(() => {
    if (!chartRef.current) return;
    const observer = new ResizeObserver(() => getInstanceByDom(chartRef.current!)?.resize());
    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  const canRender = !errorMessage && !infoMessage && hasCompleteData(data?.loadingState);

  const handleLimitChipClick = (event: React.MouseEvent<HTMLElement>) => {
    setLimitMenuAnchor(event.currentTarget);
  };

  const handleLimitMenuClose = () => {
    setLimitMenuAnchor(null);
  };

  const handleSelectLimit = (limit: number) => {
    setCategoryLimitState(limit);
    setLimitMenuAnchor(null);
  };

  return (
    <>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
          {title !== '' && (
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
              {title ?? `${field} counts`}
              <ChartInfoTooltip
                text={`${field} values \n Click legend items to show/hide · Hover for details`}
              />
            </Typography>
          )}
          {canRender && categoryLimitState && (
            <>
              <Tooltip
                title={
                  isTruncated
                    ? `This pie chart is only showing the top ${categoryLimitState} values of ${field}. The remaining values are ${hideOtherCategory ? 'hidden' : 'grouped into the "Other" category'}.`
                    : `Showing all values of ${field} (Top ${categoryLimitState} is selected but there are no more values to show).`
                }
                arrow
              >
                <Chip
                  label={
                    categoryLimitOptions ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                        {`Top ${categoryLimitState}`}
                        <ArrowDropDownIcon fontSize="small" sx={{ ml: -0.25 }} />
                      </Box>
                    ) : (
                      `Top ${categoryLimitState}`
                    )
                  }
                  variant="outlined"
                  clickable={Boolean(categoryLimitOptions)}
                  onClick={categoryLimitOptions ? handleLimitChipClick : undefined}
                  sx={{ ml: 'auto', borderColor: 'primary.main' }}
                />
              </Tooltip>

              {categoryLimitOptions && (
                <Menu
                  anchorEl={limitMenuAnchor}
                  open={Boolean(limitMenuAnchor)}
                  onClose={handleLimitMenuClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  {categoryLimitOptions.map((option) => {
                    const isSelected = option === categoryLimitState;
                    return (
                      <MenuItem
                        key={option}
                        selected={isSelected}
                        onClick={() => handleSelectLimit(option)}
                      >
                        {`Top ${option}`}
                      </MenuItem>
                    );
                  })}
                </Menu>
              )}
            </>
          )}
        </Box>

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
    </>
  );
}

export default memo(MetadataValuePieEchart);
