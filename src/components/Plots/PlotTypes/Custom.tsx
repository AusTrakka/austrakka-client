// The 'Custom' PlotType has no controls.
// It has no default spec; the plot object must provide one.
// The input spec will be expected to use the `inputdata` dataset
// Recommended to set width to "container" and leave height unconstrained
// All project metadata fields will be requested from the database

import React, { useState, useEffect } from 'react';
import { TopLevelSpec } from 'vega-lite';
import VegaDataPlot from '../VegaDataPlot';
import PlotTypeProps from '../../../types/plottypeprops.interface';

function Custom(props: PlotTypeProps) {
  const { plot, setPlotErrorMsg } = props;
  const [spec, setSpec] = useState<TopLevelSpec | null>(null);

  // Set spec on load
  useEffect(() => {
    if (plot?.spec && plot?.spec.length > 0) {
      setSpec(JSON.parse(plot.spec) as TopLevelSpec);
    } else {
      setPlotErrorMsg('PlotType Custom requires a spec but plot has no spec');
    }
  }, [plot, setPlotErrorMsg]);

  return (
    <VegaDataPlot
      spec={spec}
      dataGroupId={plot?.projectGroupId}
    />
  );
}

export default Custom;
