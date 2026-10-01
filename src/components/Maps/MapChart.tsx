import { Alert, Box, Chip, Stack, Typography } from '@mui/material';
import * as echarts from 'echarts';
import type { GeoJSON } from 'geojson';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Theme } from '../../assets/themes/theme';
import type { Field } from '../../types/dtos';
import type { Sample } from '../../types/sample.interface';
import { getColorArrayFromScheme } from '../../utilities/colourUtils';
import { aggregateGeoData } from '../../utilities/mapUtils';
import {
  type FeatureLookupFieldType,
  type GeoCountRow,
  MapGroups,
  type MapKey,
  Maps,
} from './mapMeta';

interface MapTestProps {
  colourScheme: string;
  mapSpec: MapKey;
  lookupField: FeatureLookupFieldType;
  projAbbrev: string;
  data: Sample[];
  geoField: Field | null;
}

function MapChart(props: MapTestProps) {
  const { colourScheme, mapSpec, lookupField, geoField, projAbbrev, data } = props;

  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.EChartsType | null>(null);
  const [aggregateData, setAggregateData] = useState<GeoCountRow[]>([]);
  const [missingData, setMissingData] = useState<GeoCountRow[]>([]);
  const [showAlert, setShowAlert] = useState(true);
  const [mapRenderingError, setMapRenderingError] = useState(false);

  const regionView = lookupField === 'iso_region';

  const filteredMapSpec: GeoJSON | null = useMemo(() => {
    if (!mapSpec) return null;
    const mapJson = Maps[mapSpec];
    if (!mapJson) return null;
    if (mapSpec === 'WORLD' || mapSpec in MapGroups) {
      return mapJson;
    }

    return {
      ...mapJson,
      features: mapJson.features.filter(
        (feature) => Boolean(feature.properties?.is_region) === regionView,
      ),
    };
  }, [mapSpec, regionView]);

  useEffect(() => {
    if (!chartRef.current) return undefined;

    chartInstance.current = echarts.init(chartRef.current);

    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
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

  useEffect(() => {
    if (!data || data.length === 0 || !geoField || !filteredMapSpec || !lookupField) {
      setAggregateData([]);
      setMissingData([]);
      return;
    }

    try {
      const { counts, missing } = aggregateGeoData(data, geoField, filteredMapSpec, lookupField);

      setAggregateData(counts);
      setMissingData(missing);
      setShowAlert(true);
      setMapRenderingError(false);
    } catch (_err) {
      setMapRenderingError(true);
    }
  }, [data, geoField, filteredMapSpec, lookupField]);

  useEffect(() => {
    if (!filteredMapSpec || !chartInstance.current) return;

    try {
      echarts.registerMap('currentMap', {
        ...filteredMapSpec,
        features: filteredMapSpec.features.filter(
          (feature) => !feature.properties?.not_geographical,
        ),
      } as any);
    } catch (_error) {
      setMapRenderingError(true);
    }
  }, [filteredMapSpec]);

  const updateChart = useCallback(() => {
    if (!chartInstance.current || !aggregateData.length) return;

    const counts = aggregateData.map((item) => item.count);
    const minValue = counts.length > 0 ? Math.min(...counts) : 0;
    const maxValue = counts.length > 0 ? Math.max(...counts) : 1;

    const option: echarts.EChartsOption = {
      title: {
        text: 'Choropleth Visualisation',
      },
      backgroundColor: Theme.PrimaryGrey,
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => `${params.name}: ${params.value ?? 'N/A'}`,
      },
      toolbox: {
        show: true,
        showTitle: true,
        feature: {
          saveAsImage: {
            type: 'png',
            name: `choropleth_${geoField?.columnName}_${projAbbrev}_${Date.now()}`,
          },
          dataView: {
            readOnly: true,
          },
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
          data: aggregateData.map((item) => ({
            name: item.geoFeature,
            value: item.count,
          })),
          encode: {
            name: 'name',
            value: 'value',
          },
          emphasis: {
            label: {
              show: true,
            },
          },
        },
      ],
    };

    chartInstance.current.setOption(option, true);
  }, [aggregateData, colourScheme, lookupField, geoField, projAbbrev]);

  useEffect(() => {
    if (!chartInstance.current || !aggregateData.length) return;

    updateChart();
  }, [aggregateData, updateChart]);

  if (mapRenderingError) {
    return (
      <Alert severity="error">
        <Typography>There was an error rendering the map, please refresh.</Typography>
      </Alert>
    );
  }

  return (
    <Stack spacing={1}>
      {regionView && mapSpec === 'WORLD' && (
        <Alert severity="error">
          <Typography>Regional fields are not supported with the world map</Typography>
        </Alert>
      )}

      {showAlert && missingData.length > 0 && (
        <Alert severity="info" onClose={() => setShowAlert(false)}>
          <Typography fontSize="small" gutterBottom>
            Some data values are not shown on the map because they don’t match any map regions:
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              maxHeight: 120,
              overflowY: 'auto',
              p: 1,
              borderRadius: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
            }}
          >
            {missingData.map((item) => (
              <Chip
                key={item.geoFeature}
                label={`${item.geoFeature} (${item.count})`}
                size="small"
              />
            ))}
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
