import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Typography } from '@mui/material';
import { Plot } from '../../types/dtos';
import ClusterTimeline from './PlotTypes/ClusterTimeline';
import EpiCurve from './PlotTypes/EpiCurve';
import BarChart from './PlotTypes/BarChart';
import Custom from './PlotTypes/Custom';
import HeatMap from './PlotTypes/HeatMap';
import Histogram from './PlotTypes/Histogram';
import PlotTypeProps from '../../types/plottypeprops.interface';
import { useAppSelector } from '../../app/store';
import { selectProjectMetadataError } from '../../app/projectMetadataSlice';
import { STATIC_PLOT_LIST } from '../../constants/standaloneClientConstants';

const plotTypes : { [index: string]: React.FunctionComponent<PlotTypeProps> } = {
  'ClusterTimeline': ClusterTimeline,
  'EpiCurve': EpiCurve,
  'BarChart': BarChart,
  'Histogram': Histogram,
  'HeatMap': HeatMap,
  'Custom': Custom,
};

function PlotDetail() {
  // Note that if the project abbrev is wrong in the URL, there will be no effect
  // We use the plot abbrev to get the correct project
  const { plotAbbrev } = useParams();
  const [plot, setPlot] = useState<Plot | null>();
  const [isPlotLoading, setIsPlotLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const dataErrorMsg = useAppSelector(state =>
    selectProjectMetadataError(state, plot?.projectAbbreviation));

  useEffect(() => {
    if (dataErrorMsg) {
      setErrorMsg(dataErrorMsg);
    }
  }, [dataErrorMsg]);

  useEffect(() => {
    // Get plot details, including plot type
    const _plot: Plot | undefined = STATIC_PLOT_LIST.find(p => p.abbreviation === plotAbbrev);
    if (_plot) {
      setPlot(_plot);
    } else {
      setErrorMsg(`Plot ${plotAbbrev} not found`);
    }
  }, [plotAbbrev]);

  useEffect(() => {
    if (plot) {
      if (typeof plotTypes[plot!.plotType] === 'undefined') {
        setErrorMsg(`Plot type ${plot!.plotType} cannot be rendered`);
      }
    }
  }, [plot]);

  const renderPlot = () => {
    // TODO this will not display loading if the e.g. ClusterTimeline component is loading data.
    //      Naively, we can't pass the loading state into a component without knowing which
    //      plot type component to use. Will probably require a separate loading state
    if (isPlotLoading) {
      // TODO a better loading indicator than simple text
      return <Typography>Loading plot</Typography>;
    }
    if (errorMsg && errorMsg.length > 0) {
      return <Alert severity="error">{errorMsg}</Alert>;
    }
    if (typeof plotTypes[plot!.plotType] === 'undefined') { return null; }
    return React.createElement(
      plotTypes[plot!.plotType],
      { plot, setPlotErrorMsg: setErrorMsg },
    );
  };

  return (
    <>
      <Typography className="pageTitle">
        {plot ? plot.name : ''}
      </Typography>
      {renderPlot()}
    </>
  );
}

export default PlotDetail;
