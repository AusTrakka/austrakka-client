import React, { useState, useEffect } from 'react';
import { TopLevelSpec } from 'vega-lite';
import { Box, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { MetaDataColumn } from '../../../types/dtos';
import { ResponseObject, getDisplayFields } from '../../../utilities/resourceUtils';
import { getStartingField, setFieldInSpec } from '../../../utilities/plotUtils';
import PlotTypeProps from '../../../types/plottypeprops.interface';
import VegaDataPlot from '../VegaDataPlot';
import { SAMPLE_ID_FIELD } from '../../../constants/metadataConsts';


// We will check for these in order in the given dataset, and use the first found as default
// Possible enhancement: allow preferred field to be specified in the database, overriding these
const preferredXAxisFields = ['Coverage'];

const defaultSpec: TopLevelSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  description: 'A generic bar chart with selectable categorical axis.',
  data: { name: 'inputdata' },
  width: 'container',
  mark: { type: 'bar', tooltip: true },
  encoding: {
    x: {
      field: '', // must be replaced
      bin: true,
    },
    y: {
      aggregate: 'count',
    },
  },
};

function Histogram(props: PlotTypeProps) {
  const { plot, setPlotErrorMsg } = props;
  const [spec, setSpec] = useState<TopLevelSpec | null>(null);
  const [fieldsToRetrieve, setFieldsToRetrieve] = useState<string[]>([]);
  const [categoricalFields, setCategoricalFields] = useState<string[]>([]);
  const [numericFields, setNumericFields] = useState<string[]>([]);
  const [xAxisField, setXAxisField] = useState<string>('');
  const [colourField, setColourField] = useState<string>('none');

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

  useEffect(() => {
    const updateFields = async () => {
      const response = await getDisplayFields(plot!.projectGroupId) as ResponseObject;
      if (response.status === 'Success') {
        const fields = response.data as MetaDataColumn[];
        const localNumericFields = fields
          .filter(field => field.primitiveType === 'number' || field.primitiveType === 'double')
          .map(field => field.columnName);
        console.log(localNumericFields);
        setNumericFields(localNumericFields);
        const localCatFields = fields
          .filter(field => field.canVisualise)
          .map(field => field.columnName);
        setCategoricalFields(localCatFields);
        setXAxisField(getStartingField(preferredXAxisFields, localNumericFields));
        // Note we do not set a preferred starting colour field; starting value is None
        setFieldsToRetrieve([SAMPLE_ID_FIELD, ...localNumericFields, ...localCatFields]);
      } else {
        // TODO error handling if getDisplayFields fails, possibly also if no date fields
        // eslint-disable-next-line no-console
        console.error(response.message);
      }
    };

    if (plot) {
      updateFields();
    }
  }, [plot]);

  useEffect(() => {
    const addXAxisToSpec = (oldSpec: TopLevelSpec | null): TopLevelSpec | null =>
      setFieldInSpec(oldSpec, 'x', xAxisField);

    if (xAxisField.length > 0) {
      setSpec(addXAxisToSpec);
    }
  }, [xAxisField]);

  useEffect(() => {
    // Does not use generic setFieldInSpec, for now, as we handle 'none'
    const setColorInSpec = (oldSpec: TopLevelSpec | null): TopLevelSpec | null => {
      if (oldSpec == null) return null;
      const newSpec: any = { ...oldSpec };
      if (colourField === 'none') {
        // Remove colour from encoding
        const { color, ...newEncoding } = (oldSpec as any).encoding;
        newSpec.encoding = newEncoding;
      } else {
        // Set colour in encoding
        newSpec.encoding = { ...(oldSpec as any).encoding };
        newSpec.encoding.color = {
          field: colourField,
          scale: { scheme: 'spectral' },
        };
      }
      return newSpec as TopLevelSpec;
    };

    setSpec(setColorInSpec);
  }, [colourField]);

  const renderControls = () => (
    <Box sx={{ float: 'right', marginX: 10 }}>
      <FormControl size="small" sx={{ marginX: 1, marginTop: 1 }}>
        <InputLabel id="x-axis-select-label">X-Axis</InputLabel>
        <Select
          labelId="x-axis-select-label"
          id="x-axis-select"
          value={xAxisField}
          label="X-Axis"
          onChange={(e) => setXAxisField(e.target.value)}
        >
          {
            numericFields.map(field => <MenuItem value={field}>{field}</MenuItem>)
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
          <MenuItem value="none">None</MenuItem>
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
      <VegaDataPlot
        spec={spec}
        dataGroupId={plot?.projectGroupId}
        fieldsToRetrieve={fieldsToRetrieve}
        setPlotErrorMsg={setPlotErrorMsg}
      />
    </>
  );
}

export default Histogram;
