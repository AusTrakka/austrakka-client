import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { GeoJSON, GeoJSONSourceInput } from 'echarts/types/src/coord/geo/geoTypes';
import { Stack } from '@mui/material';
import d3 from 'd3';
import { getColorArrayFromScheme } from '../../utilities/colourUtils';
import { Sample } from '../../types/sample.interface';
import { FeatureLookupFieldType, GeoCountRow, MapJson, MapKey, Maps } from './mapMeta';
import { aggregateGeoData, detectIsoType } from '../../utilities/mapUtils';
import { Field } from '../../types/dtos';

interface MapTestProps {
  colourScheme: string;
  regionViewToggle: boolean
  mapSpec: MapKey;
  projAbbrev: string;
  data: Sample[];
  geoField: Field | null;
}

function MapChart(props: MapTestProps) {
  const { colourScheme, regionViewToggle, mapSpec, geoField, projAbbrev, data } = props;
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
  const [isoType, setIsoType] = useState<FeatureLookupFieldType>('iso_2_char');
  const [mapRenderingError, setMapRenderingError] = useState<boolean>(false);

  useEffect(() => {
    if (!chartRef.current) {
      return undefined;
    }

    chartInstance.current = echarts.init(chartRef.current);

    // Clean up on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    function handleResize() {
      chartInstance.current?.resize();
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Aggregate data whenever relevant inputs change
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

    /* // if the data is regions but the region view is off aggregate by prefix
    if (isoCode === 'iso_region' && !regionViewToggle) {
      isoCode = 'iso_2_char';
    } */
    
    if (isoCode === 'iso_region') {
      setRegionView(true);
    }

    const aggregated = aggregateGeoData(
      data,
      geoField,
      Maps[mapSpec],
      isoCode,
    );

    setIsoType(isoCode);
    setAggregateData(aggregated);
  }, [data, geoField, mapSpec, regionViewToggle]);

  // Register map and update chart whenever filteredMapSpec or aggregateData changes
  useEffect(() => {
    if (!filteredMapSpec || !chartInstance.current) return;

    console.log('filteredMapSpec changed', filteredMapSpec);

    // Clear existing map registration safely
    try {
      if (echarts.getMap('currentMap')) {
        // Don't pass null, instead unregister by name
        echarts.getMap('currentMap') && echarts.registerMap('currentMap', {
          type: 'FeatureCollection',
          features: [],
        } as GeoJSONSourceInput);
      }
    } catch (error) {
      console.warn('Error clearing existing map:', error);
    }

    // Register new map with validation
    try {
      if (filteredMapSpec.features && filteredMapSpec.features.length > 0) {
        echarts.registerMap('currentMap', filteredMapSpec as GeoJSONSourceInput);

        // Update chart if we have data
        if (aggregateData.length) {
          updateChart();
        }
      }
    } catch (error) {
      console.error('Error registering map:', error);
      setMapRenderingError(true);
    }
  }, [filteredMapSpec, aggregateData, colourScheme, isoType, geoField, projAbbrev]);

  const updateChart = () => {
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
            project: (point) => [
              (point[0] / 180) * Math.PI,
              -Math.log(Math.tan((Math.PI / 2 + (point[1] / 180) * Math.PI) / 2)),
            ],
            unproject: (point) => [
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
  };

  return (
    <>
      <Stack sx={{ height: '80vh' }} display="flex">
        <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
      </Stack>
    </>
  );
}

export default MapChart;
