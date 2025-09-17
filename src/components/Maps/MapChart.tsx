import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { GeoJSON, GeoJSONSourceInput } from 'echarts/types/src/coord/geo/geoTypes';
import { Stack } from '@mui/material';
import { getColorArrayFromScheme } from '../../utilities/colourUtils';
import { Sample } from '../../types/sample.interface';
import { FeatureLookupFieldType, GeoCountRow, MapJson, Maps } from './mapMeta';
import { aggregateGeoData, detectIsoType } from '../../utilities/mapUtils';
import { Field } from '../../types/dtos';

interface MapTestProps {
  colourScheme: string;
  regionViewToggle: boolean
  mapSpec: MapJson;
  data: Sample[];
  geoField: Field | null;
}

function MapChart(props: MapTestProps) {
  const { colourScheme, regionViewToggle, mapSpec, geoField, data } = props;
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.EChartsType | null>(null);
  const filteredMapSpec: GeoJSON | null = useMemo(() => {
    if (!mapSpec) return null;

    return {
      ...mapSpec,
      features: mapSpec.features.filter(
        f => regionViewToggle || !f.properties.is_region,
      ),
    };
  }, [mapSpec, regionViewToggle]);
  
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

  // 2. Whenever filtered data changes, re-aggregate
  useEffect(() => {
    if (!data || data.length === 0 || !geoField || !mapSpec) {
      setAggregateData([]);
      return;
    }
    
    let isoCode = detectIsoType(geoField.metaDataColumnValidValues ?? []);
    if (!isoCode) {
      setMapRenderingError(true);
      return;
    }
    
    // if the data is regions but the region view is off aggregate by prefix
    if (isoCode === 'iso_region' && !regionViewToggle) {
      isoCode = 'iso_2_char';
    }

    const aggregated = aggregateGeoData(
      data,
      geoField, // change if user selects a different field later
      mapSpec,
      isoType,
    );
    
    setIsoType(isoCode);

    setAggregateData(aggregated);
  }, [data, geoField, isoType, mapSpec]);

  // Register map whenever filteredMapSpec changes
  useEffect(() => {
    console.log('filteredMapSpec changed', filteredMapSpec);
    if (!filteredMapSpec) return;
    echarts.registerMap('currentMap', filteredMapSpec as GeoJSONSourceInput);
  }, [filteredMapSpec]);

  // Update chart when aggregated data changes
  useEffect(() => {
    // if (!chartInstance.current || !aggregateData.length) return;
    if (!chartInstance.current) {
      console.log('no chartInstance');
      return;
    }
    if (!aggregateData.length) {
      console.log('no aggregateData');
      return;
    }

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
        formatter: '{b}: {c}',
      },
      toolbox: {
        show: true,
        showTitle: true,
        feature: {
          saveAsImage: {
            type: 'png',
            name: 'TESTDATA',
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

    chartInstance.current.setOption(option);
  }, [aggregateData, colourScheme, isoType, filteredMapSpec]);

  return (
    <>
      <Stack sx={{ height: '80vh' }} display="flex">
        <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
      </Stack>
    </>
  );
}

export default MapChart;
