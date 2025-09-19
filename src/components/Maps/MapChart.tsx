import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import * as echarts from 'echarts';
import { GeoJSON, GeoJSONSourceInput } from 'echarts/types/src/coord/geo/geoTypes';
import { Alert, Box, Chip, Stack, Typography } from '@mui/material';
import { getColorArrayFromScheme } from '../../utilities/colourUtils';
import { Sample } from '../../types/sample.interface';
import { FeatureLookupFieldType, GeoCountRow, MapKey, Maps } from './mapMeta';
import { aggregateGeoData, detectIsoType } from '../../utilities/mapUtils';
import { Field } from '../../types/dtos';

interface MapTestProps {
  colourScheme: string;
  mapSpec: MapKey;
  projAbbrev: string;
  data: Sample[];
  geoField: Field | null;
}

function MapChart(props: MapTestProps) {
  const { colourScheme, mapSpec, geoField, projAbbrev, data } = props;
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.EChartsType | null>(null);
  const [regionView, setRegionView] = useState(false);
  const filteredMapSpec: GeoJSON | null = useMemo(() => {
    if (!mapSpec) return null;
    const mapJson = Maps[mapSpec];
    if (!mapJson) return null;
    if (mapSpec === 'WORLD') {
      return mapJson;
    }
    
    return {
      ...mapJson,
      features: mapJson.features.filter(
        f => regionView || !f.properties.is_region,
      ),
    };
  }, [mapSpec, regionView]);

  const [aggregateData, setAggregateData] = useState<GeoCountRow[]>([]);
  const [missingData, setMissingData] = useState<GeoCountRow[]>([]);
  const [isoType, setIsoType] = useState<FeatureLookupFieldType>('iso_2_char');
  const [showAlert, setShowAlert] = useState(true);
  const [mapRenderingError, setMapRenderingError] = useState<boolean>(false);

  useEffect(() => {
    if (!chartRef.current) return undefined;

    chartInstance.current = echarts.init(chartRef.current);

    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return undefined;

    // Resize handler for window events
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    // ResizeObserver for container size changes
    const observer = new ResizeObserver(() => {
      chartInstance.current?.resize();
    });
    observer.observe(chartRef.current);

    // Force initial resize
    setTimeout(() => chartInstance.current?.resize(), 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [showAlert]); // <— rerun effect whenever alert visibility changes

  const updateChart = useCallback(() => {
    if (!chartInstance.current || !aggregateData.length) return;

    const counts = aggregateData.map(item => item.count);
    const minValue = counts.length > 0 ? Math.min(...counts) : 0;
    const maxValue = counts.length > 0 ? Math.max(...counts) : 1;

    const option: echarts.EChartsOption = {
      title: {
        text: 'Choropleth Visualisation',
      },
      backgroundColor: import.meta.env.VITE_THEME_PRIMARY_GREY,
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
          nameProperty: isoType,
          data: aggregateData.map(item => ({ name: item.geoFeature, value: item.count })),
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

    // Use notMerge: true to force complete re-render and ensure proper centering
    chartInstance.current.setOption(option, true);
  }, [aggregateData, colourScheme, isoType, geoField, projAbbrev]);

  // Register map whenever filteredMapSpec changes
  useEffect(() => {
    if (!data || data.length === 0 || !geoField || !mapSpec) {
      setAggregateData([]);
      return;
    }

    const isoCode = detectIsoType(geoField.metaDataColumnValidValues ?? []);
    if (!isoCode) {
      setMapRenderingError(true);
      return;
    }

    if (isoCode === 'iso_region') {
      setRegionView(true);
    } else {
      setRegionView(false);
    }

    const { counts: aggregated, missing } = aggregateGeoData(
      data,
      geoField,
      Maps[mapSpec],
      isoCode,
    );
    
    setIsoType(isoCode);
    setAggregateData(aggregated);
    setMissingData(missing);
    setShowAlert(true);
  }, [data, geoField, mapSpec]);

  // Register map whenever filteredMapSpec changes
  useEffect(() => {
    if (!filteredMapSpec || !chartInstance.current) return; // Add chart check

    // Clear existing map registration safely
    try {
      if (echarts.getMap('currentMap')) {
        echarts.registerMap('currentMap', {
          type: 'FeatureCollection',
          features: [],
        } as GeoJSONSourceInput);
      }
    } catch (error) {
      setMapRenderingError(true);
    }

    // Register new map with validation
    try {
      if (filteredMapSpec.features && filteredMapSpec.features.length > 0) {
        echarts.registerMap('currentMap', filteredMapSpec as GeoJSONSourceInput);
      }
    } catch (error) {
      setMapRenderingError(true);
    }
  }, [filteredMapSpec]);

  // Update chart whenever data or styling changes
  useEffect(() => {
    if (!chartInstance.current || !aggregateData.length) return;

    updateChart();
  }, [aggregateData, updateChart]);
  
  if (mapRenderingError) {
    return (
      <Alert severity="error">
        <Typography>
          There was an error rendering the map, please refresh.
        </Typography>
      </Alert>
    );
  }

  return (
    <Stack sx={{ height: '70vh' }} spacing={1}>
      {/* Error alert */}
      {regionView && mapSpec === 'WORLD' && (
      <Alert severity="error">
        <Typography>
          Regional fields are not supported with the world map
        </Typography>
      </Alert>
      )}

      {/* Info alert for missing data */}
      {showAlert && missingData.length > 0 && (
      <Alert
        severity="info"
        onClose={() => setShowAlert(false)}
      >
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
            backgroundColor: 'rgba(0,0,0,0.02)',
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

      {/* Chart container */}
      <Box
        ref={chartRef}
        sx={{
          flex: 1,
          width: '100%',
          marginTop: '10px',
          display: regionView && mapSpec === 'WORLD' ? 'none' : 'block', // <— hide chart if error
        }}
      />
    </Stack>
  );
}

export default MapChart;
