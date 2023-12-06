// This implements AusTrakka data retrieval and Vega plot rendering
// Implements elements common to all plot types

import React, { useEffect, useRef, useState } from 'react';
import { parse, View as VegaView } from 'vega';
import { TopLevelSpec, compile } from 'vega-lite';
import { Grid } from '@mui/material';
import { InlineData } from 'vega-lite/build/src/data';
import ExportVegaPlot from './ExportVegaPlot';
import DataFilters from '../DataFilters/DataFilters';
import LoadingState from '../../constants/loadingState';
import {
  selectGroupMetadata, GroupMetadataState,
} from '../../app/metadataSlice';
import { useAppSelector } from '../../app/store';
import { ProjectSample } from '../../types/sample.interface';

interface VegaDataPlotProps {
  spec: TopLevelSpec | null,
  dataGroupId: number | undefined,
}

function VegaDataPlot(props: VegaDataPlotProps) {
  const { spec, dataGroupId } = props;
  const plotDiv = useRef<HTMLDivElement>(null);
  const [vegaView, setVegaView] = useState<VegaView | null>(null);
  // this doesn't seem to help
  const [inputData, setInputData] = useState<ProjectSample[]>([]);
  const [filteredData, setFilteredData] = useState([]);
  const groupMetadata : GroupMetadataState | null =
    useAppSelector(state => selectGroupMetadata(state, dataGroupId));

  // this doesn't seem to help
  // Get input data
  useEffect(() => {
    console.log("Observed metadata state change")
    if (groupMetadata?.dataLoadingState
      && groupMetadata.dataLoadingState === LoadingState.SUCCESS
      && groupMetadata?.metadata) {
      console.log(`Setting input metadata ${groupMetadata.dataLoadingState}, ${groupMetadata.metadata.length}`)
      setInputData(groupMetadata.metadata);
    }
  }, [groupMetadata?.dataLoadingState, groupMetadata?.metadata]);

  // Render plot by creating vega view
  useEffect(() => {
    const createVegaView = async () => {
      if (vegaView) {
        vegaView.finalize();
      }
      const compiledSpec = compile(spec!).spec;
      const dataIndex: number = compiledSpec!.data!.findIndex(dat => dat.name === 'inputdata');
      (compiledSpec.data![dataIndex] as InlineData).values = filteredData;

      // Handle faceted rows in plot using responsive width
      if ((spec as any)?.encoding?.row) {
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
      }

      const view = await new VegaView(parse(compiledSpec))
        .initialize(plotDiv.current!)
        .runAsync();
      setVegaView(view);
    };

    // For now we recreate view if data changes, not just if spec changes
    // TODO what if filtered data is filtered to empty? if([]) ok?
    if (spec &&
      groupMetadata?.dataLoadingState && groupMetadata.dataLoadingState === LoadingState.SUCCESS &&
      filteredData && plotDiv?.current) {
      createVegaView();
    }
  // Review: old vegaView is just being cleaned up and should NOT be a dependency?
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec, filteredData, plotDiv, groupMetadata?.dataLoadingState]);

  return (
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
        <DataFilters
          data={inputData}
          fields={groupMetadata?.fields ?? []} // want to pass in field loading states?
          setFilteredData={setFilteredData}
          initialOpen
        />
      </Grid>
    </Grid>
  );
}

export default VegaDataPlot;
