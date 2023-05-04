import React, { useState, useEffect } from 'react';
import { VegaLite } from 'react-vega';
import { TopLevelSpec } from 'vega-lite';
import { Plot, MetaDataColumn } from '../../../types/dtos';
import { ResponseObject, getPlotData, getDisplayFields } from '../../../utilities/resourceUtils';

const SAMPLE_ID_FIELD = 'SampleName';

// Assumed fields here are Date_coll, Seq_ID(SAMPLE_ID_FIELD)
const defaultSpec: TopLevelSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  description: 'Categorical faceted timeline diagram with jitter - e.g. cluster timeline',
  data: { name: 'inputdata' }, // for Vega-Lite an object, for Vega a list of objects
  transform: [
    {
      calculate: '0.8*sqrt(-2*log(random()))*cos(2*PI*random())',
      as: 'jitter',
    },
  ],
  width: 900,
  height: 900,
  mark: 'point',
  encoding: {
    x: { field: 'Date_coll', type: 'temporal' },
    y: { field: 'cgMLST', type: 'nominal' },
    yOffset: { field: 'jitter', type: 'quantitative' },
    color: {
      field: 'cgMLST',
    },
    tooltip: { field: SAMPLE_ID_FIELD, type: 'nominal' },
  },
};

// This should probably be for all plottypes, so move out
interface SpecificPlotProps {
  plot: Plot | undefined | null,
  plotErrorMsg: string | null,
  setPlotErrorMsg: Function,
}

function ClusterTimeline(props: SpecificPlotProps) {
  const { plot, plotErrorMsg, setPlotErrorMsg } = props;
  const [spec, setSpec] = useState<TopLevelSpec | null>(null);
  const [data, setData] = useState([]);
  const [displayFields, setDisplayFields] = useState<MetaDataColumn[] | null>(null);
  // This represents "visualisable" fields: categorical, and string fields with canVisualise=true
  const [categoricalFields, setCategoricalFields] = useState<string[]>([]);
  // TODO get available date fields in the dataset

  // Set spec on load
  useEffect(() => {
    // Only try to set spec (including setting default spec) if plot has loaded
    if (plot) {
      if (plot.spec && plot.spec.length > 0) {
        setSpec(JSON.parse(plot.spec) as TopLevelSpec);
      } else {
        setSpec(defaultSpec);
      }
    }
  }, [plot]);

  // Get data on load
  useEffect(() => {
    const updatePlotData = async (fields: string[]) => {
      const response = await getPlotData(plot!.projectGroupId, fields) as ResponseObject;
      if (response.status === 'Success') {
        setData(response.data);
      } else {
        console.error(response.message);
        setPlotErrorMsg('Unable to load plot data');
      }
    };

    // For now get all display fields, but could do ID + Date_coll + categorical
    if (plot && displayFields && displayFields.length > 0) {
      const fields = [SAMPLE_ID_FIELD, ...displayFields.map(field => field.columnName)];
      updatePlotData(fields);
    }
  }, [setPlotErrorMsg, displayFields, plot]);

  // Get project's total fields and visualisable (psuedo-categorical) fields on load
  useEffect(() => {
    const updateFields = async () => {
      const response = await getDisplayFields(plot!.projectGroupId) as ResponseObject;
      if (response.status === 'Success') {
        const fields = response.data as MetaDataColumn[];
        setDisplayFields(fields);
        // Note this does not include numerical or date fields
        // For now this need only depend on canVisualise
        setCategoricalFields(fields
          .filter(field => field.canVisualise)
          .map(field => field.columnName));
      } else {
        // TODO error handling if getDisplayFields fails, possibly also if no categorical fields
        console.error(response.message);
      }
    }

    if (plot) {
      updateFields();
    }
  }, [plot]);

  const renderControls = () => {
    // Dummy for now
    return <></>;
  };

  const renderPlot = () => {
    if (spec && data) {
      return <VegaLite spec={spec!} data={{ inputdata: data }} />;
    }
    if (!plotErrorMsg || (plotErrorMsg.length === 0)) {
      return <div>Loading plot</div>
    }
    return <></>
  };

  return (
    <>
    {renderControls()}
    {renderPlot()}
    </>
  );
}

export default ClusterTimeline;
