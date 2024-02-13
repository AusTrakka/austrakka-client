import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Typography } from '@mui/material';
import { Plot } from '../../types/dtos';
import { getPlotDetails } from '../../utilities/resourceUtils';
import ClusterTimeline from './PlotTypes/ClusterTimeline';
import EpiCurve from './PlotTypes/EpiCurve';
import BarChart from './PlotTypes/BarChart';
import Custom from './PlotTypes/Custom';
import HeatMap from './PlotTypes/HeatMap';
import Histogram from './PlotTypes/Histogram';
import PlotTypeProps from '../../types/plottypeprops.interface';
import { useApi } from '../../app/ApiContext';
import LoadingState from '../../constants/loadingState';
import { ResponseObject } from '../../types/responseObject.interface';
import { ResponseType } from '../../constants/responseType';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { fetchProjectMetadata, selectProjectMetadataError } from '../../app/projectMetadataSlice';

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
  const { token, tokenLoading } = useApi();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (dataErrorMsg) {
      setErrorMsg(dataErrorMsg);
    }
  }, [dataErrorMsg]);

  useEffect(() => {
    // Get plot details, including plot type
    const getPlot = async () => {
      const plotResponse: ResponseObject = await getPlotDetails(plotAbbrev!, token);
      if (plotResponse.status === ResponseType.Success) {
        setPlot(plotResponse.data as Plot);
      } else {
        setErrorMsg(`Plot ${plotAbbrev} could not be loaded`);
      }
      setIsPlotLoading(false);
    };
    if (tokenLoading !== LoadingState.LOADING && tokenLoading !== LoadingState.IDLE) {
      getPlot();
    }
  }, [plotAbbrev, token, tokenLoading]);

  useEffect(() => {
    if (plot && tokenLoading !== LoadingState.LOADING && tokenLoading !== LoadingState.IDLE) {
      dispatch(fetchProjectMetadata({ projectAbbrev: plot.projectAbbreviation, token }));
    }
  }, [plot, dispatch, token, tokenLoading]);

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
