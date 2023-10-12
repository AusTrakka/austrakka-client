// The 'Custom' PlotType has no controls.
// It has no default spec; the plot object must provide one.
// The input spec will be expected to use the `inputdata` dataset
// Recommended to set width to "container" and leave height unconstrained
// All project metadata fields will be requested from the database

import React, { useState, useEffect } from 'react';
import { TopLevelSpec } from 'vega-lite';
import { MetaDataColumn } from '../../../types/dtos';
import { ResponseObject, getDisplayFields } from '../../../utilities/resourceUtils';
import VegaDataPlot from '../VegaDataPlot';
import PlotTypeProps from '../../../types/plottypeprops.interface';
import { SAMPLE_ID_FIELD } from '../../../constants/metadataConsts';
import { useApi } from '../../../app/ApiContext';
import LoadingState from '../../../constants/loadingState';

function Custom(props: PlotTypeProps) {
  const { plot, setPlotErrorMsg } = props;
  const [spec, setSpec] = useState<TopLevelSpec | null>(null);
  const [fieldsToRetrieve, setFieldsToRetrieve] = useState<string[]>([]);
  const { token, tokenLoading } = useApi();

  // Set spec on load
  useEffect(() => {
    if (plot?.spec && plot?.spec.length > 0) {
      setSpec(JSON.parse(plot.spec) as TopLevelSpec);
    } else {
      setPlotErrorMsg('PlotType Custom requires a spec but plot has no spec');
    }
  }, [plot, setPlotErrorMsg]);

  useEffect(() => {
    const updateFields = async () => {
      // TODO check: should display-fields be altered to work for admins, or use allowed-fields?
      const response = await getDisplayFields(plot!.projectGroupId, token) as ResponseObject;
      if (response.status === 'Success') {
        const fields = response.data as MetaDataColumn[];
        // We can't know which fields the custom spec needs; retrieve all
        setFieldsToRetrieve([SAMPLE_ID_FIELD, ...fields.map(field => field.columnName)]);
      } else {
        // eslint-disable-next-line no-console
        console.error(response.message);
      }
    };

    if (plot &&
      tokenLoading !== LoadingState.LOADING &&
      tokenLoading !== LoadingState.IDLE) {
      updateFields();
    }
  }, [plot, token, tokenLoading]);

  return (
    <VegaDataPlot
      spec={spec}
      dataGroupId={plot?.projectGroupId}
      fieldsToRetrieve={fieldsToRetrieve}
      setPlotErrorMsg={setPlotErrorMsg}
    />
  );
}

export default Custom;
