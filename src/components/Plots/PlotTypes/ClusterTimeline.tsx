import React, { useState, useEffect } from 'react';
import { TopLevelSpec } from 'vega-lite';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { MetaDataColumn } from '../../../types/dtos';
import { ResponseObject, getDisplayFields } from '../../../utilities/resourceUtils';
import VegaDataPlot from '../VegaDataPlot';
import PlotTypeProps from '../../../types/plottypeprops.interface';
import { getStartingField, setFieldInSpec } from '../../../utilities/plotUtils';
import { SAMPLE_ID_FIELD } from '../../../constants/metadataConsts';
import { useApi } from '../../../app/ApiContext';
import LoadingState from '../../../constants/loadingState';

// We will check for these in order in the given dataset, and use the first found as default
// Possible enhancement: allow preferred field to be specified in the database, overriding these
const preferredYAxisFields = ['cgMLST', 'ST', 'SNP_cluster', 'Lineage_family'];
const preferredColourFields = ['cgMLST', 'ST', 'SNP_cluster', 'Lineage_family'];
const preferredDateFields = ['Date_coll'];

// Assumed fields here are Date_coll, Seq_ID(SAMPLE_ID_FIELD)
const defaultSpec: TopLevelSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  description: 'Categorical faceted timeline diagram with jitter - e.g. cluster timeline',
  data: { name: 'inputdata' }, // for Vega-Lite an object, for Vega a list of objects
  transform: [
    {
      calculate: '(floor(random()*2)*2-1)*(pow(random(),2))',
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
      axis: { grid: true, tickBand: 'extent' },
    },
    yOffset: { field: 'jitter', type: 'quantitative' },
    color: {
      field: 'cgMLST',
      scale: { scheme: 'spectral' },
    },
    tooltip: { field: SAMPLE_ID_FIELD, type: 'nominal' },
  },
};

function ClusterTimeline(props: PlotTypeProps) {
  const { plot, setPlotErrorMsg } = props;
  const [spec, setSpec] = useState<TopLevelSpec | null>(null);
  const [fieldsToRetrieve, setFieldsToRetrieve] = useState<string[]>([]);
  // This represents psuedo-ordinal fields: categorical, and string fields with canVisualise=true
  const [categoricalFields, setCategoricalFields] = useState<string[]>([]);
  const [yAxisField, setYAxisField] = useState<string>('');
  const [colourField, setColourField] = useState<string>('');
  const [dateFields, setDateFields] = useState<string[]>([]);
  const [dateField, setDateField] = useState<string>('');
  const { token, tokenLoading } = useApi();

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

  // Get project's total fields and visualisable (psuedo-categorical) fields on load
  useEffect(() => {
    const updateFields = async () => {
      const response = await getDisplayFields(plot!.projectGroupId, token) as ResponseObject;
      if (response.status === 'Success') {
        const fields = response.data as MetaDataColumn[];
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
        // For this plot retrieve categorical and date fields
        setFieldsToRetrieve([SAMPLE_ID_FIELD, ...localCatFields, ...localDateFields]);
      } else {
        // TODO error handling if getDisplayFields fails, possibly also if no categorical fields
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

  useEffect(() => {
    const addYAxisToSpec = (oldSpec: TopLevelSpec | null): TopLevelSpec | null =>
      setFieldInSpec(oldSpec, 'y', yAxisField);

    if (yAxisField.length > 0) {
      setSpec(addYAxisToSpec);
    }
  }, [yAxisField]);

  useEffect(() => {
    const addColourToSpec = (oldSpec: TopLevelSpec | null): TopLevelSpec | null =>
      setFieldInSpec(oldSpec, 'color', colourField);

    if (colourField.length > 0) {
      setSpec(addColourToSpec);
    }
  }, [colourField]);

  useEffect(() => {
    const addDateFieldToSpec = (oldSpec: TopLevelSpec | null): TopLevelSpec | null =>
      setFieldInSpec(oldSpec, 'x', dateField);

    if (dateField.length > 0) {
      setSpec(addDateFieldToSpec);
    }
  }, [dateField]);

  const renderControls = () => (
    <Box sx={{ float: 'right', marginX: 10 }}>
      <FormControl size="small" sx={{ marginX: 1, marginTop: 1 }}>
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
      <FormControl size="small" sx={{ marginX: 1, marginTop: 1 }}>
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
      <FormControl size="small" sx={{ marginX: 1, marginTop: 1 }}>
        <InputLabel id="date-field-select-label">X-Axis Date Field</InputLabel>
        <Select
          labelId="date-field-select-label"
          id="date-field-select"
          value={dateField}
          label="X-Axis Date Field"
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
      <VegaDataPlot
        spec={spec}
        dataGroupId={plot?.projectGroupId}
        fieldsToRetrieve={fieldsToRetrieve}
        setPlotErrorMsg={setPlotErrorMsg}
      />
    </>
  );
}

export default ClusterTimeline;
