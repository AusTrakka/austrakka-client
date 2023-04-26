import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Typography } from '@mui/material';
import { Plot } from '../../types/dtos';
import ClusterTimeline from './PlotTypes/ClusterTimeline';
import { ResponseObject, getPlotDetails } from '../../utilities/resourceUtils';

function PlotDetail() {
  // Note that if the project abbrev is wrong in the URL, there will be no effect
  // We use the plot abbrev to get the correct project
  const { plotAbbrev } = useParams();
  const [plot, setPlot] = useState<Plot | null>();
  const [isPlotLoading, setIsPlotLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Get plot details, including plot type
    const getPlot = async () => {
      const plotResponse: ResponseObject = await getPlotDetails(plotAbbrev!);
      if (plotResponse.status === 'Success') {
        setPlot(plotResponse.data as Plot);
      } else {
        setErrorMsg(`Plot ${plotAbbrev} could not be loaded`);
      }
      setIsPlotLoading(false);
    };

    getPlot();
  }, [plotAbbrev]);

  useEffect(() => {
    const KNOWN_TYPES = ['ClusterTimeline'];
    if (plot) {
      if (!KNOWN_TYPES.includes(plot!.plotType)) {
        setErrorMsg(`Plot type ${plot!.plotType} cannot be rendered`);
      }
    }
  }, [plot]);

  const renderPlot = () => {
    // TODO this will not display loading if the e.g. ClusterTimeline component is loading data
    //      naively we can't pass the loading state into a component without knowing which
    //      plot type component to use. Will probably require a separate loading state
    if (isPlotLoading) {
      // TODO a better loading indicator than simple text
      return <Typography>Loading plot</Typography>;
    }
    if (errorMsg && errorMsg.length > 0) {
      return <Alert severity="error">{errorMsg}</Alert>;
    }
    // Could use React.createElement instead of a switch statement
    switch (plot!.plotType) {
      case 'ClusterTimeline':
        return <ClusterTimeline plot={plot} />;
      default:
        // eslint-disable-next-line react/jsx-no-useless-fragment
        return <></>;
    }
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
