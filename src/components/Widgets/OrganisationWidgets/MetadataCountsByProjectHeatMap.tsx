import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {
  Alert,
  AlertTitle,
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { type ECharts, type EChartsOption, init } from 'echarts';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import type { DataTableFilterMeta } from 'primereact/datatable';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useStableNavigate } from '../../../app/NavigationContext';
import { type OrgMetadataState, selectOrgMetadata } from '../../../app/orgMetadataSlice';
import { type RootState, useAppSelector } from '../../../app/store';
import { Theme } from '../../../assets/themes/theme';
import MetadataLoadingState, { hasCompleteData } from '../../../constants/metadataLoadingState';
import { columnStyleRules } from '../../../styles/metadataFieldStyles';
import type { Sample } from '../../../types/sample.interface';
import { WidgetType } from '../../../types/widget.props';
import { hexToRgb, interpolateRgb } from '../../../utilities/colourUtils';
import { getSharedProjectNames, stripOwnerSuffix } from '../../../utilities/dataProcessingUtils';
import { updateTabUrlWithSearch } from '../../../utilities/navigationUtils';

const SHARED_GROUPS_FIELD = 'Shared_groups';
const UNKNOWN_VALUE_LABEL = 'unknown';
const UNSHARED_ROW = 'Unshared';

interface MetadataCountsByProjectProps {
  widgetType: WidgetType;
  identifier: string;
  title?: string;
  categoryField: string;
  filteredData: Sample[];
}

interface MatrixResult {
  projects: string[];
  categories: string[];
  counts: number[][];
  totals: number[];
}

function buildSharedGroupsMatrix(data: Sample[], categoryField: string): MatrixResult {
  const matrix = new Map<string, Map<string, number>>();
  const allCategories = new Set<string>();

  for (const sample of data) {
    const projects = getSharedProjectNames(
      sample[SHARED_GROUPS_FIELD as keyof Sample] as string | undefined,
    );

    const rawCategory = (sample[categoryField as keyof Sample] as string) ?? '';
    const strippedCategory =
      categoryField === 'Owner_group' ? stripOwnerSuffix(rawCategory) : rawCategory;
    const category = strippedCategory === '' ? UNKNOWN_VALUE_LABEL : strippedCategory;
    allCategories.add(category);

    if (projects.length === 0) {
      if (!matrix.has(UNSHARED_ROW)) matrix.set(UNSHARED_ROW, new Map());
      const categoryCounts = matrix.get(UNSHARED_ROW)!;
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
      continue;
    }

    projects.forEach((project) => {
      if (!matrix.has(project)) matrix.set(project, new Map());
      const categoryCounts = matrix.get(project)!;
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    });
  }

  const categories = [...allCategories].sort((a, b) => {
    if (a === UNKNOWN_VALUE_LABEL) return 1;
    if (b === UNKNOWN_VALUE_LABEL) return -1;
    return a.localeCompare(b);
  });

  const projectTotals = [...matrix.entries()].map(([project, categoryCounts]) => {
    const total = [...categoryCounts.values()].reduce((sum, c) => sum + c, 0);
    return { project, total };
  });

  projectTotals.sort((a, b) => {
    const aIsUnshared = a.project === UNSHARED_ROW;
    const bIsUnshared = b.project === UNSHARED_ROW;
    if (aIsUnshared && !bIsUnshared) return -1;
    if (!aIsUnshared && bIsUnshared) return 1;
    return b.total - a.total;
  });

  const projects = projectTotals.map((p) => p.project);
  const totals = projectTotals.map((p) => p.total);

  const counts = projects.map((project) =>
    categories.map((category) => matrix.get(project)?.get(category) ?? 0),
  );

  return { projects, categories, counts, totals };
}

function buildPlaceholderMatrix(): MatrixResult {
  const projects = Array.from({ length: 6 }, (_, i) => `row-${i}`);
  const categories = Array.from({ length: 10 }, (_, i) => `col-${i}`);

  const counts = projects.map((_, r) =>
    categories.map((_, c) => Math.abs(Math.sin(r * 3 + c * 7)) * 10),
  );

  return { projects, categories, counts, totals: [] };
}

function computeIdealZoom(container: HTMLDivElement, matrix: MatrixResult) {
  const { projects, categories } = matrix;
  const maxCategoryCharLength = categories.reduce((max, cat) => Math.max(max, cat.length), 0);
  const MIN_CATEGORY_CELL_WIDTH = Math.min(85, Math.max(45, maxCategoryCharLength * 8));
  const TARGET_ROW_HEIGHT = 36;
  const ESTIMATED_Y_AXIS_WIDTH = 120;

  const availableWidth = Math.max(100, container.clientWidth - ESTIMATED_Y_AXIS_WIDTH);
  const availableHeight = Math.max(100, container.clientHeight - 40);

  const visibleCols = Math.max(1, Math.floor(availableWidth / MIN_CATEGORY_CELL_WIDTH));
  const visibleRows = Math.max(1, Math.floor(availableHeight / TARGET_ROW_HEIGHT));

  return {
    maxCategoryIdx: Math.min(categories.length - 1, visibleCols - 1),
    maxProjectIdx: Math.min(projects.length - 1, visibleRows - 1),
    visibleCols,
    visibleRows,
  };
}

function MetadataCountsByProjectHeatMap(props: MetadataCountsByProjectProps) {
  const { identifier, title, categoryField, widgetType, filteredData } = props;
  const { navigate } = useStableNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ECharts | null>(null);

  const metadataSelector = useMemo(
    () => (state: RootState) => {
      switch (widgetType) {
        case WidgetType.Organisation:
          return selectOrgMetadata(state, identifier);
        default:
          throw new Error(`This widget is not supported for widget type: ${widgetType}`);
      }
    },
    [identifier, widgetType],
  );

  const data: OrgMetadataState | null = useAppSelector(metadataSelector);
  const loaded = hasCompleteData(data?.loadingState);

  const errorMessage = useMemo(() => {
    if (data?.loadingState === MetadataLoadingState.ERROR)
      return data.errorMessage ?? 'Unknown error';
    return null;
  }, [data]);

  const infoMessage = useMemo(() => {
    if (data?.fields && data.fields.length > 0) {
      const fieldNames = data.fields.map((f) => f.columnName);
      if (!fieldNames.includes(SHARED_GROUPS_FIELD))
        return `Field ${SHARED_GROUPS_FIELD} not found in ${widgetType}. Add this field to the ${widgetType} to see data.`;
      if (!fieldNames.includes(categoryField))
        return `Field ${categoryField} not found in ${widgetType}. Add this field to the ${widgetType} to see data.`;
    }
    return null;
  }, [data, categoryField, widgetType]);

  const matrix = useMemo<MatrixResult | null>(() => {
    if (!data?.metadata || data.loadingState !== MetadataLoadingState.DATA_LOADED) return null;
    return buildSharedGroupsMatrix(data.metadata as Sample[], categoryField);
  }, [data?.metadata, data?.loadingState, categoryField]);

  const isCategoryItalic = columnStyleRules[categoryField] !== undefined;

  const handleResetZoom = useCallback(() => {
    const chart = chartRef.current;
    const container = containerRef.current;
    if (!chart || !container || !matrix) return;

    const { maxCategoryIdx, maxProjectIdx } = computeIdealZoom(container, matrix);

    chart.dispatchAction({
      type: 'dataZoom',
      batch: [
        { dataZoomId: 'x-slider', startValue: 0, endValue: maxCategoryIdx },
        { dataZoomId: 'x-inside', startValue: 0, endValue: maxCategoryIdx },
        { dataZoomId: 'y-slider', startValue: 0, endValue: maxProjectIdx },
        { dataZoomId: 'y-inside', startValue: 0, endValue: maxProjectIdx },
      ],
    });
  }, [matrix]);

  const handleCellClick = useCallback(
    (project: string, categoryValue: string) => {
      const unsharedFlag = project === UNSHARED_ROW;
      const unknownFlag = categoryValue === UNKNOWN_VALUE_LABEL;

      const filters: DataTableFilterMeta = {
        [SHARED_GROUPS_FIELD]: {
          operator: FilterOperator.AND,
          constraints: [
            {
              matchMode: unsharedFlag ? FilterMatchMode.CUSTOM : FilterMatchMode.CONTAINS,
              value: unsharedFlag ? 'true' : project,
            },
          ],
        },
        [categoryField]: {
          operator: FilterOperator.AND,
          constraints: [
            {
              matchMode: unknownFlag ? FilterMatchMode.CUSTOM : FilterMatchMode.EQUALS,
              value: unknownFlag ? 'true' : categoryValue,
            },
          ],
        },
      };
      updateTabUrlWithSearch(navigate, '/samples', filters);
    },
    [navigate, categoryField],
  );

  // Init chart once and handle container resize dynamically
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = init(containerRef.current);
    chartRef.current = chart;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        chart.resize();
      });
    });

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
      if (!matrix) return;
      const container = containerRef.current;
      if (!container) return;

      const { visibleCols, visibleRows } = computeIdealZoom(container, matrix);

      const option = chart.getOption() as any;
      const xZoom = option?.dataZoom?.find((z: any) => z.id === 'x-slider');
      const yZoom = option?.dataZoom?.find((z: any) => z.id === 'y-slider');

      const currentXStart = xZoom?.startValue ?? 0;
      const currentYStart = yZoom?.startValue ?? 0;

      const newXEnd = Math.min(matrix.categories.length - 1, currentXStart + visibleCols - 1);
      const newYEnd = Math.min(matrix.projects.length - 1, currentYStart + visibleRows - 1);

      chart.dispatchAction({
        type: 'dataZoom',
        batch: [
          { dataZoomId: 'x-slider', startValue: currentXStart, endValue: newXEnd },
          { dataZoomId: 'x-inside', startValue: currentXStart, endValue: newXEnd },
          { dataZoomId: 'y-slider', startValue: currentYStart, endValue: newYEnd },
          { dataZoomId: 'y-inside', startValue: currentYStart, endValue: newYEnd },
        ],
      });
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, [matrix]);

  useEffect(() => {
    const chart = chartRef.current;
    const container = containerRef.current;
    if (!chart || !matrix || !container) return;

    const { projects, categories, counts } = matrix;
    const maxCount = counts.reduce((max, row) => Math.max(max, ...row), 0);

    const { maxCategoryIdx, maxProjectIdx } = computeIdealZoom(container, matrix);

    // Parse gradient endpoints once instead of per-cell
    const startRgb = hexToRgb(Theme.SecondaryMain300);
    const endRgb = hexToRgb(Theme.SecondaryMain600);

    const seriesData = projects.flatMap((project, projectIndex) =>
      categories.map((category, categoryIndex) => {
        const value = counts[projectIndex][categoryIndex];
        const color =
          !maxCount || value === 0
            ? Theme.SecondaryMain50
            : interpolateRgb(startRgb, endRgb, value / maxCount);

        return {
          value: [categoryIndex, projectIndex, value],
          itemStyle: { color, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          project,
          category,
          percent: value > 0 ? (value / filteredData.length) * 100 : 0,
        };
      }),
    );

    const option: EChartsOption = {
      animation: false,
      animationDurationUpdate: 0,
      grid: {
        left: 10,
        right: 20,
        top: 10,
        bottom: 25,
        containLabel: true,
      },
      tooltip: {
        trigger: 'item',
        appendToBody: true,
        formatter: (params: any) => {
          const { project, category, percent } = params.data;
          const [, , value] = params.data.value;
          return `<strong>${project}</strong><br/>${category}: ${value} (${percent.toFixed(2)}%)`;
        },
      },
      visualMap: {
        show: false,
        min: 0,
        max: Math.max(1, maxCount),
        calculable: false,
      },
      dataZoom: [
        {
          id: 'x-slider',
          type: 'slider',
          xAxisIndex: 0,
          bottom: 0,
          height: 14,
          startValue: 0,
          endValue: maxCategoryIdx,
          filterMode: 'empty',
          showDetail: false,
          moveOnMouseWheel: false,
          brushSelect: true,
        },
        {
          id: 'x-inside',
          type: 'inside',
          xAxisIndex: 0,
          startValue: 0,
          endValue: maxCategoryIdx,
          filterMode: 'empty',
          zoomOnMouseWheel: false,
          moveOnMouseWheel: false,
          moveOnMouseMove: true,
        },
        {
          id: 'y-slider',
          type: 'slider',
          yAxisIndex: 0,
          right: 0,
          width: 14,
          startValue: 0,
          endValue: maxProjectIdx,
          filterMode: 'empty',
          showDetail: false,
          brushSelect: true,
        },
        {
          id: 'y-inside',
          type: 'inside',
          yAxisIndex: 0,
          startValue: 0,
          endValue: maxProjectIdx,
          filterMode: 'empty',
          zoomOnMouseWheel: false,
          moveOnMouseWheel: false,
          moveOnMouseMove: true,
        },
      ],
      xAxis: {
        type: 'category',
        data: categories,
        splitArea: { show: false },
        axisLabel: {
          interval: 0,
          hideOverlap: false,
          overflow: 'break',
          width: 85,
          fontStyle: isCategoryItalic ? 'italic' : 'normal',
        },
        axisLine: { show: false },
        axisTick: {
          show: true,
          alignWithLabel: true,
          length: 5,
          lineStyle: {
            color: Theme.PrimaryGrey500,
            width: 1,
          },
        },
      },
      yAxis: {
        type: 'category',
        data: projects,
        inverse: true,
        splitArea: { show: false },
        axisLine: { show: false },
        axisTick: {
          show: true,
          alignWithLabel: true,
          length: 5,
          lineStyle: {
            color: Theme.PrimaryGrey500,
            width: 1,
          },
        },
      },
      series: [
        {
          type: 'heatmap',
          data: seriesData,
          itemStyle: {
            borderRadius: 4,
          },
          emphasis: {
            itemStyle: {
              borderColor: Theme.SecondaryMain,
              borderWidth: 2,
            },
          },
        },
      ],
    };
    chart.setOption(option, true);
    chart.off('click');
    chart.on('click', (params: any) => {
      if (params.componentType === 'series') {
        handleCellClick(params.data.project, params.data.category);
      }
    });
  }, [matrix, isCategoryItalic, filteredData.length, handleCellClick]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !matrix) return;

    let accumulatedX = 0;
    let accumulatedY = 0;
    const STEP_THRESHOLD = 50;

    const handleWheel = (e: WheelEvent) => {
      const chart = chartRef.current;
      if (!chart) return;

      const rawDelta = e.shiftKey ? e.deltaX : e.deltaY;
      if (rawDelta === 0) return;

      if (e.shiftKey) {
        accumulatedX += rawDelta;
        if (Math.abs(accumulatedX) < STEP_THRESHOLD) return;

        const step = Math.sign(accumulatedX);
        accumulatedX = 0;

        const option = chart.getOption() as any;
        const xZoom = option?.dataZoom?.find((z: any) => z.id === 'x-slider');
        if (!xZoom) return;

        const total = matrix.categories.length;
        const windowSize = xZoom.endValue - xZoom.startValue;
        const maxStart = total - 1 - windowSize;

        const start = Math.max(0, Math.min(maxStart, xZoom.startValue + step));
        if (start === xZoom.startValue) return;

        e.preventDefault();
        const end = start + windowSize;

        chart.dispatchAction({
          type: 'dataZoom',
          batch: [
            { dataZoomId: 'x-slider', startValue: start, endValue: end },
            { dataZoomId: 'x-inside', startValue: start, endValue: end },
          ],
        });
      } else {
        accumulatedY += rawDelta;
        if (Math.abs(accumulatedY) < STEP_THRESHOLD) return;

        const step = Math.sign(accumulatedY);
        accumulatedY = 0;

        const option = chart.getOption() as any;
        const yZoom = option?.dataZoom?.find((z: any) => z.id === 'y-slider');
        if (!yZoom) return;

        const total = matrix.projects.length;
        const windowSize = yZoom.endValue - yZoom.startValue;
        const maxStart = total - 1 - windowSize;

        const start = Math.max(0, Math.min(maxStart, yZoom.startValue + step));
        if (start === yZoom.startValue) return;

        e.preventDefault();
        const end = start + windowSize;

        chart.dispatchAction({
          type: 'dataZoom',
          batch: [
            { dataZoomId: 'y-slider', startValue: start, endValue: end },
            { dataZoomId: 'y-inside', startValue: start, endValue: end },
          ],
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () => {
      container.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [matrix]);

  const renderPlaceholder = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const placeholder = buildPlaceholderMatrix();
    const { projects, categories, counts } = placeholder;

    const maxCount = counts.reduce((max, row) => Math.max(max, ...row), 0);

    const seriesData = projects.flatMap((_, r) =>
      categories.map((_, c) => ({
        value: [c, r, counts[r][c]],
        itemStyle: { color: Theme.PrimaryGrey200, borderColor: '#fff', borderWidth: 2 },
      })),
    );

    chart.setOption(
      {
        animation: false,
        grid: { left: 10, right: 10, top: 10, bottom: 10, containLabel: false },
        tooltip: { show: false },
        visualMap: {
          show: false,
          min: 0,
          max: Math.max(1, maxCount),
          calculable: false,
        },
        dataZoom: [],
        xAxis: { type: 'category', data: categories, show: false },
        yAxis: { type: 'category', data: projects, show: false },
        series: [
          {
            type: 'heatmap',
            data: seriesData,
            itemStyle: { borderRadius: 4 },
            silent: true,
          },
        ],
      },
      true,
    );
  }, []);

  const isEmpty =
    loaded && !errorMessage && !infoMessage && (!matrix || matrix.projects.length === 0);

  useEffect(() => {
    if (isEmpty) {
      renderPlaceholder();
    }
  }, [isEmpty, renderPlaceholder]);

  return (
    <Box
      sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}
    >
      {title !== '' && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography
            variant="h5"
            paddingBottom={3}
            color="primary"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
          >
            {title ?? `${categoryField} counts by project`}
          </Typography>
        </Box>
      )}

      {errorMessage && (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {errorMessage}
        </Alert>
      )}

      {infoMessage && !errorMessage && <Alert severity="info">{infoMessage}</Alert>}

      {!loaded && !errorMessage && !infoMessage && (
        <Box
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          flex={1}
          minHeight={0}
        >
          <CircularProgress size={24} />
        </Box>
      )}

      {loaded && !errorMessage && !infoMessage && (
        <Box flex={1} minHeight={0} width="100%" sx={{ position: 'relative', overflow: 'hidden' }}>
          <Tooltip title="Reset zoom" arrow>
            <IconButton
              size="small"
              disabled={isEmpty}
              onClick={handleResetZoom}
              sx={{
                position: 'absolute',
                padding: 0.5,
                bottom: 10,
                right: 0,
                zIndex: 1,
                backgroundColor: 'transparent',
                '&:hover': { backgroundColor: Theme.SecondaryMain50 },
              }}
            >
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        </Box>
      )}
    </Box>
  );
}

export default MetadataCountsByProjectHeatMap;
