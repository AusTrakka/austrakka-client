import { Alert, Button, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '../../app/ApiContext';
import {
  fetchProjectMetadata,
  selectProjectMetadataError,
  selectProjectStaleDataAvailable,
} from '../../app/projectMetadataSlice';
import { useAppDispatch, useAppSelector } from '../../app/store';
import { plotTypes } from '../../config/plotTypes';
import LoadingState from '../../constants/loadingState';
import { ResponseType } from '../../constants/responseType';
import type { Plot } from '../../types/dtos';
import type PlotTypeProps from '../../types/plottypeprops.interface';
import { getPlotDetails } from '../../utilities/resourceUtils';

function PlotDetail() {
  const { projectAbbrev, plotAbbrev } = useParams();
  const [plot, setPlot] = useState<Plot | null>();
  const [plotType, setPlotType] = useState<string | null>();
  const [isPlotLoading, setIsPlotLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const dataErrorMsg = useAppSelector((state) => selectProjectMetadataError(state, projectAbbrev));
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
      const plotResponse = await getPlotDetails(plotAbbrev!, token);
      if (plotResponse.status === ResponseType.Success) {
        const plotTypeFromResponse = plotResponse.data!.plotType;
        if (typeof plotTypes[plotTypeFromResponse] === 'undefined') {
          setErrorMsg(`Plot ${plotAbbrev} has invalid type ${plotTypeFromResponse}`);
          return;
        }
        setPlot(plotResponse.data!);
        setPlotType(plotTypeFromResponse);
      } else {
        setErrorMsg(`Plot ${plotAbbrev} was not found`);
      }
    };

    // If plotAbbrev exactly matches a known plot type, treat as generic plot, else get from API
    if (typeof plotTypes[plotAbbrev!] !== 'undefined') {
      setPlotType(plotAbbrev!);
      setIsPlotLoading(false);
    } else {
      if (tokenLoading !== LoadingState.LOADING && tokenLoading !== LoadingState.IDLE) {
        getPlot();
        setIsPlotLoading(false);
      }
    }
  }, [plotAbbrev, token, tokenLoading]);

  useEffect(() => {
    if (
      projectAbbrev &&
      tokenLoading !== LoadingState.LOADING &&
      tokenLoading !== LoadingState.IDLE
    ) {
      dispatch(fetchProjectMetadata({ projectAbbrev, token }));
    }
  }, [projectAbbrev, dispatch, token, tokenLoading]);

  const staleDataAvailable = useAppSelector((state) =>
    selectProjectStaleDataAvailable(state, projectAbbrev),
  );

  const renderPlot = () => {
    if (errorMsg && errorMsg.length > 0) {
      return <Alert severity="error">{errorMsg}</Alert>;
    }
    if (isPlotLoading) {
      return <Typography>Loading...</Typography>;
    }
    if (!plotType || typeof plotTypes[plotType] === 'undefined') {
      return null;
    }
    var props: PlotTypeProps = {
      projectAbbrev,
      customSpec: plot?.spec,
      setPlotErrorMsg: setErrorMsg,
    };
    return React.createElement(plotTypes[plotType].component, props);
  };

  const handleRefresh = () => {
    if (!projectAbbrev || !token) return;
    dispatch(fetchProjectMetadata({ projectAbbrev, token }));
  };

  return (
    <>
      {staleDataAvailable && (
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Refresh
            </Button>
          }
          sx={{ mb: 1 }}
        >
          Newer data is available for this project.
        </Alert>
      )}

      <Typography className="pageTitle">
        {plotType ? (plot?.name ?? plotTypes[plotType].name) : ''}
      </Typography>
      {renderPlot()}
    </>
  );
}

export default PlotDetail;
