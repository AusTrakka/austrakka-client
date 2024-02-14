import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { TopLevelSpec } from 'vega-lite';
import { selectProjectMetadataFields } from '../../../app/projectMetadataSlice';
import { useAppSelector } from '../../../app/store';
import { SAMPLE_ID_FIELD } from '../../../constants/metadataConsts';
import PlotTypeProps from '../../../types/plottypeprops.interface';
import { getStartingField, setFieldInSpec } from '../../../utilities/plotUtils';
import VegaDataPlot from '../VegaDataPlot';

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
  const { fields } = useAppSelector(
    state => selectProjectMetadataFields(state, plot?.projectAbbreviation),
  );
  // This represents psuedo-ordinal fields: categorical, and string fields with canVisualise=true
  const [categoricalFields, setCategoricalFields] = useState<string[]>([]);
  const [yAxisField, setYAxisField] = useState<string>('');
  const [colourField, setColourField] = useState<string>('');
  const [dateFields, setDateFields] = useState<string[]>([]);
  const [dateField, setDateField] = useState<string>('');

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
    if (fields && fields.length > 0) {
      // Note this does not include numerical or date fields
      // For now this selection need only depend on canVisualise
      const localCatFields = fields
        .filter(field => field.canVisualise &&
          (field.fieldDataType === 'string' || field.fieldDataType === null))
        .map(field => field.fieldName);
      setCategoricalFields(localCatFields);
      const localDateFields = fields
        .filter(field => field.fieldDataType === 'date')
        .map(field => field.fieldName);
      setDateFields(localDateFields);
      // Mandatory fields: one categorical field
      if (localCatFields.length === 0) {
        setPlotErrorMsg('No visualisable categorical fields found in project, cannot render plot');
        return;
      }
      setYAxisField(getStartingField(preferredYAxisFields, localCatFields));
      setColourField(getStartingField(preferredColourFields, localCatFields));
      setDateField(getStartingField(preferredDateFields, localDateFields));
    }
  }, [fields, setPlotErrorMsg]);

  useEffect(() => {
    const addYAxisToSpec = (oldSpec: TopLevelSpec | null): TopLevelSpec | null =>
      setFieldInSpec(oldSpec, 'y', yAxisField);

    if (yAxisField.length > 0) {
      setSpec(addYAxisToSpec);
    }
  }, [yAxisField]);

  // TODO maybe handle none and set better legend, as for other plots?
  // We know there must be at least one cat field for the y axis, so this will work,
  // but maybe the user would prefer none for colour field regardless
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
        projectAbbrev={plot?.projectAbbreviation}
      />
    </>
  );
}

export default ClusterTimeline;
