// This implements AusTrakka data retrieval and Vega plot rendering
// Implements elements common to all plot types

import React, { useEffect, useRef, useState } from 'react';
import { parse, View as VegaView } from 'vega';
import { TopLevelSpec, compile } from 'vega-lite';
import { InlineData } from 'vega-lite/build/src/data';
import { ResponseObject, getPlotData } from '../../utilities/resourceUtils';

interface VegaDataPlotProps {
  spec: TopLevelSpec | null,
  dataGroupId: number | undefined,
  fieldsToRetrieve: string[],
  setPlotErrorMsg: Function,
}

function VegaDataPlot(props: VegaDataPlotProps) {
  const { spec, dataGroupId, fieldsToRetrieve, setPlotErrorMsg } = props;
  const plotDiv = useRef<HTMLDivElement>(null);
  const [vegaView, setVegaView] = useState<VegaView | null>(null);
  const [data, setData] = useState([]);

  // Get data on load
  useEffect(() => {
    const updatePlotData = async () => {
      const response = await getPlotData(dataGroupId!, fieldsToRetrieve) as ResponseObject;
      if (response.status === 'Success') {
        setData(response.data);
      } else {
        console.error(response.message);
        setPlotErrorMsg('Unable to load plot data');
      }
    };

    // For now get all display fields, but could do ID + dates + categorical
    if (dataGroupId && fieldsToRetrieve && fieldsToRetrieve.length > 0) {
      updatePlotData();
    }
  }, [setPlotErrorMsg, fieldsToRetrieve, dataGroupId, setData]);

  // Render plot by creating vega view
  useEffect(() => {
    const createVegaView = async () => {
      if (vegaView) {
        vegaView.finalize();
      }
      const compiledSpec = compile(spec!).spec;
      (compiledSpec.data![0] as InlineData).values = data;
      const view = await new VegaView(parse(compiledSpec))
        .initialize(plotDiv.current!)
        .runAsync();
      setVegaView(view);
    };

    // For now we recreate view if data changes, not just if spec changes
    if (spec && data && plotDiv?.current) {
      createVegaView();
    }
  // Review: old vegaView is just being cleaned up and should NOT be a dependency?
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec, data, plotDiv]);

  return (
    <div id="#plot-container" ref={plotDiv} />
  );
}

export default VegaDataPlot;
