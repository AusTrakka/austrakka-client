// This implements AusTrakka data retrieval and Vega plot rendering
// Implements elements common to all plot types

import React, { useEffect, useRef, useState } from 'react';
import { parse, Spec, View as VegaView } from 'vega';
import { TopLevelSpec, compile } from 'vega-lite';
import { Grid, LinearProgress } from '@mui/material';
import { InlineData } from 'vega-lite/build/src/data';
import { DataTable } from 'primereact/datatable';
import ExportVegaPlot from './ExportVegaPlot';
import DataFilters, { DataFilter, defaultState } from '../DataFilters/DataFilters';
import {
  selectProjectMetadata, ProjectMetadataState,
} from '../../app/projectMetadataSlice';
import MetadataLoadingState from '../../constants/metadataLoadingState';
import { useAppSelector } from '../../app/store';
import { Sample } from '../../types/sample.interface';
import { convertDataTableFilterMetaToDataFilterObject, isEqual, useStateFromSearchParamsForFilterObject } from '../../utilities/helperUtils';

interface VegaDataPlotProps {
  spec: TopLevelSpec | Spec | null,
  projectAbbrev: string | undefined,
}

function VegaDataPlot(props: VegaDataPlotProps) {
  const { spec, projectAbbrev } = props;
  const plotDiv = useRef<HTMLDivElement>(null);
  const [vegaView, setVegaView] = useState<VegaView | null>(null);
  const [filteredData, setFilteredData] = useState<Sample[]>([]);
  const [isDataFiltersOpen, setIsDataFiltersOpen] = useState(true);
  const [filterList, setFilterList] = useState<DataFilter[]>([]);
  const [initialisingFilters, setInitialisingFilters] = useState<boolean>(true);
  const [currentFilters, setCurrentFilters] = useStateFromSearchParamsForFilterObject(
    'filters',
    defaultState,
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [mutableFilteredData, setMutableFilteredData] = useState<string>();
  const metadata : ProjectMetadataState | null =
    useAppSelector(state => selectProjectMetadata(state, projectAbbrev));

  useEffect(() => {
    setMutableFilteredData(JSON.parse(JSON.stringify(filteredData)));
  }, [filteredData]);

  useEffect(() => {
    const initialFilterState = () => {
      if (!isEqual(currentFilters, defaultState)) {
        setFilterList(convertDataTableFilterMetaToDataFilterObject(
          currentFilters,
          metadata?.fields!,
        ));
      } else {
        setFilterList([]);
      }
      setInitialisingFilters(false);
    };
    if (metadata?.loadingState === MetadataLoadingState.DATA_LOADED &&
      metadata?.fields && initialisingFilters) {
      initialFilterState();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metadata?.loadingState, metadata?.fields]);

  // Render plot by creating vega view
  useEffect(() => {
    // Modifies compiledSpec in place
    const fixRowWidths = (compiledSpec: Spec) => {
      if (!compiledSpec.signals) { compiledSpec.signals = []; }
      // -80 compensates for default Vega facet padding values
      const newSignal = {
        name: 'child_width',
        init: 'isFinite(containerSize()[0]) ? (containerSize()[0] - 80) : 200',
        on: [{
          events: 'window:resize',
          update: 'isFinite(containerSize()[0]) ? (containerSize()[0] - 80) : 200',
        }],
      };
      const signalIndex: number = compiledSpec.signals.findIndex(sig => sig.name === 'child_width');
      if (signalIndex > -1) {
        compiledSpec.signals[signalIndex] = newSignal;
      } else {
        compiledSpec.signals.push(newSignal);
      }
    };

    const createVegaView = async () => {
      if (vegaView) {
        vegaView.finalize();
      }
      // Don't compile if spec is vega. If unspecified, assume vega-lite
      let compiledSpec: Spec;
      if (spec?.$schema && spec.$schema.includes('schema/vega/')) {
        compiledSpec = spec as Spec;
      } else {
        compiledSpec = compile((spec as TopLevelSpec)!).spec;
      }
      const dataIndex: number = compiledSpec!.data!.findIndex(dat => dat.name === 'inputdata');
      // TODO show a warning on the UI as well
      if (dataIndex === -1) {
        // eslint-disable-next-line no-console
        console.error('Bad plot spec: inputdata slot not found in spec');
        return;
      }
      // check if the filtered datastate is the same as before
      (compiledSpec.data![dataIndex] as InlineData).values = mutableFilteredData ?? [];
      // Handle faceted rows in plot using responsive width
      if ((spec as any)?.encoding?.row) {
        fixRowWidths(compiledSpec);
      }

      setLoading(true);
      const view = await new VegaView(parse(compiledSpec))
        .initialize(plotDiv.current!)
        .runAsync();
      setVegaView(view);
      setLoading(false);
    };

    // For now we recreate view if data changes, not just if spec changes
    if (spec &&
        metadata?.loadingState &&
        (metadata.loadingState === MetadataLoadingState.DATA_LOADED ||
          metadata.loadingState === MetadataLoadingState.PARTIAL_DATA_LOADED ||
          metadata.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR) &&
        mutableFilteredData &&
        plotDiv?.current) {
      // TODO it appears this may trigger too often?
      createVegaView();
    }
  // Review: old vegaView is just being cleaned up and should NOT be a dependency?
  // loadingState is not a dependency as we only care about changes that co-occur with filteredData
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec, mutableFilteredData, plotDiv]);

  useEffect(() => {
    if (metadata?.loadingState &&
      (metadata.loadingState === MetadataLoadingState.DATA_LOADED ||
        metadata.loadingState === MetadataLoadingState.PARTIAL_DATA_LOADED ||
        metadata.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR) &&
       Object.keys(currentFilters).length === 0) {
      setMutableFilteredData(JSON.parse(JSON.stringify((metadata.metadata!))));
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metadata?.metadata]);

  if (initialisingFilters) { return null; }

  return (
    <>
      <Grid container direction="column">
        <Grid container item direction="row">
          <Grid item xs={11}>
            <div id="#plot-container" ref={plotDiv} />
          </Grid>
          <Grid item xs={1}>
            <ExportVegaPlot
              vegaView={vegaView}
            />
          </Grid>
        </Grid>
        <Grid item xs={12}>
          {loading &&
          <LinearProgress color="success" variant="indeterminate" />}
          <DataFilters
            dataLength={metadata?.metadata?.length ?? 0}
            filteredDataLength={filteredData.length ?? 0}
            visibleFields={null}
            allFields={metadata?.fields ?? []}
            setPrimeReactFilters={setCurrentFilters}
            isOpen={isDataFiltersOpen}
            setIsOpen={setIsDataFiltersOpen}
            filterList={filterList}
            setFilterList={setFilterList}
            setLoadingState={setLoading}
          />
        </Grid>
      </Grid>
      <div style={{ display: 'none' }}>
        <DataTable
          value={metadata?.metadata ?? []}
          filters={currentFilters}
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

export default VegaDataPlot;
