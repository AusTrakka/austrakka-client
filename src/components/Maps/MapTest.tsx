import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { GeoJSONSourceInput } from 'echarts/types/src/coord/geo/geoTypes';
import { Stack } from '@mui/material';
import { DataTable } from 'primereact/datatable';
import 'leaflet/dist/leaflet.css';
import ausNzMap from '../../assets/maps/au_nz_processed.json';
import { fetchProjectMetadata, ProjectMetadataState, selectProjectMetadata } from '../../app/projectMetadataSlice';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { aggregateGeoData, GeoCountRow } from '../../utilities/plotUtils';
import MetadataLoadingState from '../../constants/metadataLoadingState';
import LoadingState from '../../constants/loadingState';
import { useApi } from '../../app/ApiContext';
import { getColorArrayFromScheme } from '../../utilities/colourUtils';
import DataFilters, { defaultState } from '../DataFilters/DataFilters';
import { useStateFromSearchParamsForFilterObject } from '../../utilities/stateUtils';
import { Sample } from '../../types/sample.interface';

// Register the map once
const filteredGeoJson = { ...ausNzMap,
  features: ausNzMap.features.filter(f => {
    const code = f.properties.iso_code;
    return code === 'AU' || code === 'NZ' || code?.startsWith('AU-');
  }) };
echarts.registerMap('aus-nz', filteredGeoJson as GeoJSONSourceInput);

interface MapTestProps {
  colourScheme: string;
  projectAbbrev: string | undefined;
}
function MapTest(props: MapTestProps) {
  const { colourScheme, projectAbbrev } = props;
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.EChartsType | null>(null);
  const [filteredData, setFilteredData] = useState<Sample[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDataTableFilterOpen, setIsDataTableFilterOpen] = useState(true);
  const [allFieldsLoaded, setAllFieldsLoaded] = useState(false);
  const [aggregateData, setAggregateData] = useState<GeoCountRow[]>([]);
  const { token, tokenLoading } = useApi();
  const dispatch = useAppDispatch();
  const [currentFilters, setCurrentFilters] = useStateFromSearchParamsForFilterObject(
    'filters',
    defaultState,
  );
  const data : ProjectMetadataState | null =
      useAppSelector(state => selectProjectMetadata(state, projectAbbrev));

  useEffect(() => {
    if (projectAbbrev &&
        tokenLoading !== LoadingState.LOADING &&
        tokenLoading !== LoadingState.IDLE) {
      const someValue = dispatch(fetchProjectMetadata({ projectAbbrev, token }));
    }
  }, [dispatch, projectAbbrev, token, tokenLoading]);
  
  useEffect(() => {
    if (!chartRef.current) {
      return;
    }
    chartInstance.current = echarts.init(chartRef.current);
 
    // Clean up on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []); // Empty dependency - initialize once

  useEffect(() => {
    function handleResize() {
      chartInstance.current?.resize();
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Aggregate data when metadata finishes loading
  useEffect(() => {
    if (!data) return;
    const state = data.loadingState;

    if (
      state !== MetadataLoadingState.DATA_LOADED &&
        state !== MetadataLoadingState.ERROR &&
        state !== MetadataLoadingState.PARTIAL_LOAD_ERROR
    ) return;

    if (!data.metadata) return;

    setFilteredData(data.metadata);
    setAllFieldsLoaded(true);
  }, [data]);

  // 2. Whenever filtered data changes, re-aggregate
  useEffect(() => {
    if (!filteredData || filteredData.length === 0) return;

    const aggregated = aggregateGeoData(
      filteredData,
      'State', // change if user selects a different field later
      filteredGeoJson,
      'iso_code',
    );

    setAggregateData(aggregated);
  }, [filteredData]);

  // Update chart when aggregated data changes
  useEffect(() => {
    // if (!chartInstance.current || !aggregateData.length) return;
    if (!chartInstance.current) {
      return;
    }
    if (!aggregateData.length) {
      return;
    }

    const counts = aggregateData.map(item => item.count);
    const minValue = counts.length > 0 ? Math.min(...counts) : 0;
    const maxValue = counts.length > 0 ? Math.max(...counts) : 1;

    const option: echarts.EChartsOption = {
      title: {
        text: 'TEST DATA ON AU AND NZ',
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
              (2 * 180) / Math.PI * Math.atan(Math.exp(point[1])) - 90,
            ],
          },
          roam: true,
          map: 'aus-nz',
          nameProperty: 'iso_code',
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
  }, [aggregateData, colourScheme]);

  return (
    <>
      <Stack sx={{ height: 800 }} display="flex">
        <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
      </Stack>
      <Stack>
        <DataFilters
          dataLength={data?.metadata?.length ?? 0}
          filteredDataLength={filteredData?.length ?? 0}
          visibleFields={null}
          allFields={data?.fields ?? []}
          setPrimeReactFilters={setCurrentFilters}
          primeReactFilters={currentFilters}
          isOpen={isDataTableFilterOpen}
          setIsOpen={setIsDataTableFilterOpen}
          dataLoaded={loading || allFieldsLoaded}
          setLoadingState={setLoading}
        />
      </Stack>
      <div style={{ display: 'none' }}>
        <DataTable
          value={data?.metadata ?? []}
          filters={allFieldsLoaded ? currentFilters : defaultState}
          paginator
          rows={1}
          onValueChange={(e) => {
            setFilteredData(e);
          }}
        />
      </div>
    </>
  );
}

export default MapTest;
