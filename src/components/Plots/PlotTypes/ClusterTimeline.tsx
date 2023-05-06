import React, { useState, useEffect, useRef } from 'react';
import { compile, TopLevelSpec } from 'vega-lite';
import { parse, View as VegaView } from 'vega';
import { Box, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { Plot, MetaDataColumn } from '../../../types/dtos';
import { ResponseObject, getPlotData, getDisplayFields } from '../../../utilities/resourceUtils';

const SAMPLE_ID_FIELD = 'SampleName';

// We will check for these in order in the given dataset, and use the first found as default
// Possible enhancement: allow preferred field to be specified in the database, overriding these
const preferredYAxisFields = ['cgMLST', 'ST', 'SNP_cluster'];

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
  width: 'container',
  height: { step: 70 },
  mark: 'point',
  encoding: {
    x: {
      field: 'Date_coll',
      type: 'temporal',
      axis: { grid: false },
    },
    y: {
      field: 'cgMLST',
      type: 'nominal',
      axis: { grid: true },
    },
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
  setPlotErrorMsg: Function,
}

function ClusterTimeline(props: SpecificPlotProps) {
  const { plot, setPlotErrorMsg } = props;
  const plotDiv = useRef<HTMLDivElement>(null);
  const [vegaView, setVegaView] = useState<VegaView | null>(null);
  const [spec, setSpec] = useState<TopLevelSpec | null>(null);
  const [data, setData] = useState([]);
  const [yAxisField, setYAxisField] = useState<string>("");
  const [displayFields, setDisplayFields] = useState<MetaDataColumn[] | null>(null);
  // This represents "visualisable" fields: categorical, and string fields with canVisualise=true
  const [categoricalFields, setCategoricalFields] = useState<string[]>([]);
  // TODO get available date fields in the dataset

  // Get the field to populate a selector when fields first loaded
  const getStartingField = (preferredFields, availableFields) => {
    for (const preferredField of preferredFields) {
      if (availableFields.includes(preferredField)) {
        return preferredField;
      }
    }
    return availableFields[0];
  };

  // Set spec on load
  useEffect(() => {
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

    // For now get all display fields, but could do ID + dates + categorical
    if (plot && displayFields && displayFields.length > 0) {
      const fields = [SAMPLE_ID_FIELD, ...displayFields.map(field => field.columnName)];
      updatePlotData(fields);
    }
  }, [setPlotErrorMsg, displayFields, plot]);

  // Get project's total fields and visualisable (psuedo-categorical) fields on load
  useEffect(() => {
    const updateFields = async () => {
      // TODO check: should display-fields be altered to work for admins, or use allowed-fields?
      const response = await getDisplayFields(plot!.projectGroupId) as ResponseObject;
      if (response.status === 'Success') {
        const fields = response.data as MetaDataColumn[];
        setDisplayFields(fields);
        // Note this does not include numerical or date fields
        // For now this selection need only depend on canVisualise
        const catFields = fields
          .filter(field => field.canVisualise)
          .map(field => field.columnName);
        setCategoricalFields(catFields);
        // Set default y-axis field
        setYAxisField(getStartingField(preferredYAxisFields, catFields));
      } else {
        // TODO error handling if getDisplayFields fails, possibly also if no categorical fields
        console.error(response.message);
      }
    };

    if (plot) {
      updateFields();
    }
  }, [plot]);

  // Render plot by creating vega view
  useEffect(() => {
    const createVegaView = async () => {
      if (vegaView) {
        vegaView.finalize();
      }
      const compiledSpec = compile(spec!).spec;
      compiledSpec.data![0]['values'] = data;
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

  useEffect(() => {
    const addYAxisToSpec = (oldSpec: TopLevelSpec|null): TopLevelSpec|null => {
      if (oldSpec === null) {
        return null;
      }
      return (
        {
          ...oldSpec,
          encoding: {
            ...oldSpec!.encoding,
            y: {
              ...oldSpec!.encoding!.y,  // already ordinal
              field: yAxisField,
            },
          },
        }
      );
    };

    if (yAxisField.length > 0) {
      setSpec(addYAxisToSpec);
    }
  }, [yAxisField]);

  const handleYAxisSelect = (event: SelectChangeEvent) => {
    setYAxisField(event.target.value);
  };

  const renderControls = () => (
    <Box sx={{ margin: 5 }}>
      <FormControl fullWidth>
        <InputLabel id="y-axis-select-label">Y-Axis</InputLabel>
        <Select
          labelId="y-axis-select-label"
          id="y-axis-select"
          value={yAxisField}
          label="Y-Axis"
          onChange={handleYAxisSelect}
        >
          {
            categoricalFields.map(field => <MenuItem value={field}>{field}</MenuItem>)
          }
        </Select>
      </FormControl>
    </Box>
  );

  return (
    <>
      {renderControls()}
      <div id="#plot-container" ref={plotDiv} />
    </>
  );
}

export default ClusterTimeline;
