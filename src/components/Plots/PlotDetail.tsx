import { Alert, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { selectProjectMetadataError } from '../../app/projectMetadataSlice';
import { useAppSelector } from '../../app/store';
import { plotTypes } from '../../config/plotTypes';
import { localProjectAbbrev } from '../../constants/standaloneClientConstants';
import PlotTypeProps from '../../types/plottypeprops.interface';

function PlotDetail() {
  const { plotType } = useParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const dataErrorMsg = useAppSelector((state) =>
    selectProjectMetadataError(state, localProjectAbbrev),
  );

  useEffect(() => {
    if (dataErrorMsg) {
      setErrorMsg(dataErrorMsg);
    }
  }, [dataErrorMsg]);

  useEffect(() => {
    if (plotType) {
      if (typeof plotTypes[plotType] === 'undefined') {
        setErrorMsg(`Plot type ${plotType} cannot be rendered`);
      }
    }
  }, [plotType]);

  const renderPlot = () => {
    // TODO this will not display loading if the e.g. ClusterTimeline component is loading data.
    //      Naively, we can't pass the loading state into a component without knowing which
    //      plot type component to use. Will probably require a separate loading state
    if (errorMsg && errorMsg.length > 0) {
      return <Alert severity="error">{errorMsg}</Alert>;
    }
    if (!plotType || typeof plotTypes[plotType] === 'undefined') {
      return null;
    }
    return React.createElement(plotTypes[plotType], {
      projectAbbrev: localProjectAbbrev,
      customSpec: null,
      setPlotErrorMsg: setErrorMsg,
    });
  };

  return (
    <>
      <Typography className="pageTitle">{plotType}</Typography>
      {renderPlot()}
    </>
  );
}

export default PlotDetail;
