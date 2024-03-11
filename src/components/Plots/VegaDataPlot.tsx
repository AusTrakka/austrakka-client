// This implements AusTrakka data retrieval and Vega plot rendering
// Implements elements common to all plot types

import React, { useEffect, useRef, useState } from 'react';
import { parse, View as VegaView } from 'vega';
import { TopLevelSpec, compile } from 'vega-lite';
import { Grid } from '@mui/material';
import { InlineData } from 'vega-lite/build/src/data';
import { DataTableFilterMeta } from 'primereact/datatable';
import ExportVegaPlot from './ExportVegaPlot';
import DataFilters, { DataFilter } from '../DataFilters/DataFilters';
import {
  selectProjectMetadata, ProjectMetadataState,
} from '../../app/projectMetadataSlice';
import MetadataLoadingState from '../../constants/metadataLoadingState';
import { useAppSelector } from '../../app/store';

interface VegaDataPlotProps {
  spec: TopLevelSpec | null,
  projectAbbrev: string | undefined,
}

function VegaDataPlot(props: VegaDataPlotProps) {
  const { spec, projectAbbrev } = props;
  const plotDiv = useRef<HTMLDivElement>(null);
  const [vegaView, setVegaView] = useState<VegaView | null>(null);
  const [filteredData, setFilteredData] = useState([]);
  const [isDataFiltersOpen, setIsDataFiltersOpen] = useState(true);
  const [filterList, setFilterList] = useState<DataFilter[]>([]);
  const metadata : ProjectMetadataState | null =
    useAppSelector(state => selectProjectMetadata(state, projectAbbrev));

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
        metadata?.loadingState &&
        (metadata.loadingState === MetadataLoadingState.DATA_LOADED ||
          metadata.loadingState === MetadataLoadingState.PARTIAL_DATA_LOADED ||
          metadata.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR) &&
        filteredData &&
        plotDiv?.current) {
      // TODO it appears this may trigger too often?
      createVegaView();
    }
  // Review: old vegaView is just being cleaned up and should NOT be a dependency?
  // loadingState is not a dependency as we only care about changes that co-occur with filteredData
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec, filteredData, plotDiv]);

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
          dataLength={0}
          filteredDataLength={0}
          visibleFields={[]}
          allFields={[]}
          setPrimeReactFilters={function (value: React.SetStateAction<DataTableFilterMeta>): void {
            throw new Error('Function not implemented.');
          }}
          isOpen={false}
          setIsOpen={function (value: React.SetStateAction<boolean>): void {
            throw new Error('Function not implemented.');
          }}
          filterList={[]}
          setFilterList={function (value: React.SetStateAction<DataFilter[]>): void {
            throw new Error('Function not implemented.');
          }}
          setLoadingState={function (value: React.SetStateAction<boolean>): void {
            throw new Error('Function not implemented.');
          }}
        />
      </Grid>
    </Grid>
  );
}

export default VegaDataPlot;
