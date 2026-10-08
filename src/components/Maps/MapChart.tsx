import { Alert, Box, Chip, Stack, Typography } from '@mui/material';
import * as echarts from 'echarts';
import type { GeoJSON } from 'geojson';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Theme } from '../../assets/themes/theme';
import type { Field } from '../../types/dtos';
import type { Sample } from '../../types/sample.interface';
import { getColorArrayFromScheme } from '../../utilities/colourUtils';
import { aggregateGeoData, isSupplementMap } from '../../utilities/mapUtils';
import {
  DEFAULT_TOOLTIP_PROPERTY,
  FeatureLookupField,
  type FeatureLookupFieldType,
  type MapKey,
  MapLabels,
  Maps,
  MapTooltipProperty,
} from './mapMeta';

const MAP_BORDER_STYLE = { borderWidth: 0.2, borderColor: Theme.PrimaryGrey500 };

interface MapTestProps {
  colourScheme: string;
  mapSpec: MapKey;
  primaryMapKey: MapKey;
  lookupField: FeatureLookupFieldType;
  projAbbrev: string;
  data: Sample[];
  geoField: Field | null;
}

function MapChart(props: MapTestProps) {
  const { colourScheme, mapSpec, primaryMapKey, lookupField, geoField, projAbbrev, data } = props;

  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.EChartsType | null>(null);
  const registeredSpec = useRef<GeoJSON | null>(null);
  const renderedMap = useRef<MapKey | null>(null);
  const renderedPrimaryMap = useRef<MapKey | null>(null);
  const roamState = useRef<{ zoom: number; center: [number, number] } | null>(null);
  const [showAlert, setShowAlert] = useState(true);
  const [mapRenderingError, setMapRenderingError] = useState(false);

  const regionView = lookupField === FeatureLookupField.ISO_REGION;
  const isDenseMap = isSupplementMap(mapSpec);

  // Optimized & consolidated filtering for performance on dense maps
  const filteredMapSpec: GeoJSON | null = useMemo(() => {
    if (!mapSpec) return null;
    const mapJson = Maps[mapSpec];
    if (!mapJson) return null;

    const filteredFeatures = mapJson.features.filter((feature) => {
      // Filter out non-geographical features early
      if (feature.properties?.not_geographical) return false;
      // Filter by region view if applicable (skipped for world/dense maps)
      if (mapSpec !== 'WORLD' && !isDenseMap) {
        return Boolean(feature.properties?.is_region) === regionView;
      }
      return true;
    });

    return {
      ...mapJson,
      features: filteredFeatures,
    };
  }, [mapSpec, regionView, isDenseMap]);

  const aggregated = useMemo(() => {
    const empty = { counts: [], missing: [], failed: false };
    if (!data || data.length === 0 || !geoField || !filteredMapSpec || !lookupField) {
      return empty;
    }

    try {
      return { ...aggregateGeoData(data, geoField, filteredMapSpec, lookupField), failed: false };
    } catch (_err) {
      return { ...empty, failed: true };
    }
  }, [data, geoField, filteredMapSpec, lookupField]);

  const tooltipLabels = useMemo(() => {
    const labelProperty = MapTooltipProperty[mapSpec] ?? DEFAULT_TOOLTIP_PROPERTY;
    const labels = new Map<string, string>();

    filteredMapSpec?.features.forEach((feature) => {
      const key = feature.properties?.[lookupField];
      const label = feature.properties?.[labelProperty];
      if (key && label && label !== key) {
        labels.set(String(key), String(label));
      }
    });

    return labels;
  }, [filteredMapSpec, mapSpec, lookupField]);

  useEffect(() => {
    if (!chartRef.current) return undefined;

    // Explicitly use canvas renderer for high performance on dense polygon maps
    chartInstance.current = echarts.init(chartRef.current, undefined, { renderer: 'canvas' });

    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
      registeredSpec.current = null;
      renderedMap.current = null;
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: resize when alert visibility changes container size
  useEffect(() => {
    if (!chartRef.current) return undefined;

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    const observer = new ResizeObserver(() => {
      chartInstance.current?.resize();
    });
    observer.observe(chartRef.current);

    setTimeout(() => chartInstance.current?.resize(), 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [showAlert]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: only want to show alert on first render of new data
  useEffect(() => {
    setShowAlert(true);
  }, [aggregated]);

  // Register the map and draw in one step
  useEffect(() => {
    const chart = chartInstance.current;
    if (!chart || !filteredMapSpec || aggregated.failed || !aggregated.counts.length) return;

    if (registeredSpec.current !== filteredMapSpec) {
      try {
        echarts.registerMap('currentMap', filteredMapSpec as any);
        registeredSpec.current = filteredMapSpec;
      } catch (_error) {
        setMapRenderingError(true);
        return;
      }
    }

    const mapChanged = renderedMap.current !== mapSpec;
    const isSamePrimaryMap =
      renderedPrimaryMap.current !== null && renderedPrimaryMap.current === primaryMapKey;

    if (!isSamePrimaryMap) {
      roamState.current = null;
    }

    const preserveRoam = mapChanged && isSamePrimaryMap && roamState.current !== null;

    renderedMap.current = mapSpec;
    renderedPrimaryMap.current = primaryMapKey;

    const counts = aggregated.counts.map((item) => item.count);
    const minValue = Math.min(...counts);
    const maxValue = Math.max(...counts);
    const mappedTotal = aggregated.counts.reduce((sum, item) => sum + item.count, 0);
    const missingTotal = aggregated.missing.reduce((sum, item) => sum + item.count, 0);

    const option: echarts.EChartsOption = {
      title: {
        text: `${geoField?.columnName ?? 'Samples'} · ${MapLabels[mapSpec]}`,
        subtext: `${mappedTotal} samples mapped${missingTotal ? ` · ${missingTotal} not matched` : ''}`,
      },
      animation: !isDenseMap,
      backgroundColor: Theme.PrimaryGrey,
      tooltip: {
        trigger: 'item',
        transitionDuration: isDenseMap ? 0 : 0.4,
        formatter: (params: any) => {
          const name = params.name || 'Unknown';
          const value = params.value ?? 'N/A';
          const extra = tooltipLabels.get(params.name);

          const mainLine = `<strong>${name}</strong>: ${value}`;
          return extra ? `${mainLine}<br/>${extra}` : mainLine;
        },
      },
      toolbox: {
        show: true,
        showTitle: true,
        feature: {
          restore: { show: true, title: 'Reset zoom' },
          saveAsImage: {
            type: 'png',
            name: `choropleth_${geoField?.columnName}_${projAbbrev}_${Date.now()}`,
          },
          ...(isDenseMap ? {} : { dataView: { readOnly: true } }),
        },
      },
      visualMap: {
        left: 'left',
        min: minValue,
        max: maxValue,
        bottom: 'bottom',
        text: ['High', 'Low'],
        calculable: true,
        inRange: {
          color: getColorArrayFromScheme(colourScheme, 9),
        },
      },
      series: [
        {
          name: 'Region Data',
          type: 'map',
          projection: {
            project: (point: [number, number]) => [
              (point[0] / 180) * Math.PI,
              -Math.log(Math.tan((Math.PI / 2 + (point[1] / 180) * Math.PI) / 2)),
            ],
            unproject: (point: [number, number]) => [
              (point[0] * 180) / Math.PI,
              ((2 * 180) / Math.PI) * Math.atan(Math.exp(point[1])) - 90,
            ],
          },
          roam: true,
          map: 'currentMap',
          nameProperty: lookupField,
          selectedMode: false,
          itemStyle: MAP_BORDER_STYLE,
          data: aggregated.counts.map((item) => ({
            name: item.geoFeature,
            value: item.count,
          })),
          encode: {
            name: 'name',
            value: 'value',
          },
          emphasis: isDenseMap
            ? {
                label: { show: false },
                itemStyle: { borderColor: Theme.SecondaryDarkGrey, borderWidth: 0.8 },
              }
            : { label: { show: true } },
        },
      ],
    };

    setMapRenderingError(false);

    // 1. Set base option first so the native "Reset zoom" button keeps the true default extent
    chart.setOption(option, { notMerge: mapChanged });

    // 2. Apply preserved zoom state afterward without overriding the default state
    if (preserveRoam && roamState.current) {
      chart.setOption({
        series: [
          {
            zoom: roamState.current.zoom,
            center: roamState.current.center,
          },
        ],
      });
    }
  }, [
    filteredMapSpec,
    aggregated,
    colourScheme,
    lookupField,
    geoField,
    projAbbrev,
    isDenseMap,
    tooltipLabels,
    mapSpec,
    primaryMapKey,
  ]);

  useEffect(() => {
    const chart = chartInstance.current;
    if (!chart) return undefined;

    const handleGeoRoam = () => {
      const option = chart.getOption() as any;
      const series = Array.isArray(option.series) ? option.series[0] : option.series;

      if (!series) return;

      if (
        typeof series.zoom === 'number' &&
        Array.isArray(series.center) &&
        series.center.length === 2
      ) {
        roamState.current = {
          zoom: series.zoom,
          center: [series.center[0], series.center[1]],
        };
      }
    };

    chart.on('georoam', handleGeoRoam);

    return () => {
      chart.off('georoam', handleGeoRoam);
    };
  }, []);

  if (mapRenderingError || aggregated.failed) {
    return (
      <Alert severity="error">
        <Typography>There was an error rendering the map, please refresh.</Typography>
      </Alert>
    );
  }

  const missingData = aggregated.missing;

  return (
    <Stack spacing={1}>
      {regionView && mapSpec === 'WORLD' && (
        <Alert severity="error">
          <Typography>Regional fields are not supported with the world map</Typography>
        </Alert>
      )}

      {showAlert && missingData.length > 0 && (
        <Alert severity="info" onClose={() => setShowAlert(false)}>
          <Typography fontSize="small">
            {missingData.reduce((sum, item) => sum + item.count, 0)} data values are not shown on
            this map because they don’t match any map regions.
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.5,
              mt: 1,
              maxHeight: 80,
              overflowY: 'auto',
            }}
          >
            {missingData.slice(0, 20).map((item) => (
              <Chip
                key={item.geoFeature}
                label={`${item.geoFeature} (${item.count})`}
                size="small"
              />
            ))}

            {missingData.length > 20 && (
              <Chip label={`+${missingData.length - 20} more`} size="small" variant="outlined" />
            )}
          </Box>
        </Alert>
      )}

      <Box
        ref={chartRef}
        sx={{
          width: '100%',
          height: '70vh',
          marginTop: '10px',
          display: regionView && mapSpec === 'WORLD' ? 'none' : 'block',
        }}
      />
    </Stack>
  );
}

export default MapChart;
