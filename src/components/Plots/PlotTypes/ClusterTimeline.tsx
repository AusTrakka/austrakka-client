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
const preferredColourFields = ['cgMLST', 'ST', 'SNP_cluster'];
const preferredDateFields = ['Date_coll'];

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
  const [colourField, setColourField] = useState<string>("");
  const [dateField, setDateField] = useState<string>("");
  const [displayFields, setDisplayFields] = useState<MetaDataColumn[] | null>(null);
  // This represents "visualisable" fields: categorical, and string fields with canVisualise=true
  const [categoricalFields, setCategoricalFields] = useState<string[]>([]);
  const [dateFields, setDateFields] = useState<string[]>([]);

  // Get the field to populate a selector when fields first loaded
  // If preferred field is not of the correct type it will simply appear unavailable
  const getStartingField = (preferredFields, availableFields) => {
    for (const preferredField of preferredFields) {
      if (availableFields.includes(preferredField)) {
        return preferredField;
      }
    }
    return availableFields[0];
  };

  const setFieldInSpec = (oldSpec: TopLevelSpec|null, field: string, value: string): TopLevelSpec|null => {
    if (oldSpec === null) {
      return null;
    }
    // A shallow copy of unaltered elements; replace altered
    // Note we do not change other properties of specified field, e.g. type
    let newSpec = {...oldSpec};
    newSpec.encoding = {...oldSpec.encoding};
    newSpec['encoding'][field] = {...oldSpec['encoding'][field]};
    newSpec['encoding'][field]['field'] = value;
    return newSpec;
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
        const localCatFields = fields
          .filter(field => field.canVisualise)
          .map(field => field.columnName);
        setCategoricalFields(localCatFields);
        setYAxisField(getStartingField(preferredYAxisFields, localCatFields));
        setColourField(getStartingField(preferredColourFields, localCatFields));
        const localDateFields = fields
          .filter(field => field.primitiveType === 'date')
          .map(field => field.columnName);
        setDateFields(localDateFields);
        setDateField(getStartingField(preferredDateFields, localDateFields));
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
    const addYAxisToSpec = (oldSpec: TopLevelSpec|null): TopLevelSpec|null => setFieldInSpec(oldSpec, 'y', yAxisField);

    if (yAxisField.length > 0) {
      setSpec(addYAxisToSpec);
    }
  }, [yAxisField]);

  useEffect(() => {
    const addColourToSpec = (oldSpec: TopLevelSpec|null): TopLevelSpec|null => setFieldInSpec(oldSpec, 'color', colourField);

    if (colourField.length > 0) {
      setSpec(addColourToSpec);
    }
  }, [colourField]);

  useEffect(() => {
    const addDateFieldToSpec = (oldSpec: TopLevelSpec|null): TopLevelSpec|null => setFieldInSpec(oldSpec, 'x', dateField);

    if (dateField.length > 0) {
      setSpec(addDateFieldToSpec);
    }
  }, [dateField]);

  const renderControls = () => (
    <Box sx={{ margin: 5 }}>
      <FormControl sx={{ marginX: 3 }}>
        <InputLabel id="y-axis-select-label">Y-Axis</InputLabel>
        <Select
          labelId="y-axis-select-label"
          id="y-axis-select"
          value={yAxisField}
          label="Y-Axis"
          onChange={(e) => setYAxisField(e.target.value)}
        >
          {
            categoricalFields.map(field => <MenuItem value={field}>{field}</MenuItem>)
          }
        </Select>
      </FormControl>
      <FormControl sx={{ marginX: 3 }}>
        <InputLabel id="colour-field-select-label">Colour</InputLabel>
        <Select
          labelId="colour-field-select-label"
          id="colour-field-select"
          value={colourField}
          label="Colour"
          onChange={(e) => setColourField(e.target.value)}
        >
          {
            categoricalFields.map(field => <MenuItem value={field}>{field}</MenuItem>)
          }
        </Select>
      </FormControl>
      <FormControl sx={{ marginX: 3 }}>
        <InputLabel id="date-field-select-label">X-Axis Date Field</InputLabel>
        <Select
          labelId="date-field-select-label"
          id="date-field-select"
          value={dateField}
          label="X-Axis"
          onChange={(e) => setDateField(e.target.value)}
        >
          {
            dateFields.map(field => <MenuItem value={field}>{field}</MenuItem>)
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
