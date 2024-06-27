import React, { useState, useEffect } from 'react';
import { TopLevelSpec } from 'vega-lite';
import { Box, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { getStartingField, setColorInSpecToValue, setFieldInSpec } from '../../../utilities/plotUtils';
import PlotTypeProps from '../../../types/plottypeprops.interface';
import VegaDataPlot from '../VegaDataPlot';
import { useAppSelector } from '../../../app/store';
import { selectProjectMetadataFields } from '../../../app/projectMetadataSlice';
import { ColorSchemeSelectorPlotStyle } from '../../Trees/TreeControls/SchemeSelector';
import { useStateFromSearchParamsForPrimitive } from '../../../utilities/helperUtils';

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
  const { fields, fieldUniqueValues } = useAppSelector(
    state => selectProjectMetadataFields(state, plot?.projectAbbreviation),
  );
  const searchParams = new URLSearchParams(window.location.search);
  const [categoricalFields, setCategoricalFields] = useState<string[]>([]);
  const [numericFields, setNumericFields] = useState<string[]>([]);
  const [xAxisField, setXAxisField] = useStateFromSearchParamsForPrimitive<string>(
    'xAxisField',
    '',
    searchParams,
  );
  const [colourField, setColourField] = useStateFromSearchParamsForPrimitive<string>(
    'colourField',
    'none',
    searchParams,
  );
  const [colourScheme, setColourScheme] = useStateFromSearchParamsForPrimitive<string>(
    'colourScheme',
    'spectral',
    searchParams,
  );
  const [binMode, setBinMode] = useStateFromSearchParamsForPrimitive<string>(
    'binMode',
    'auto',
    searchParams,
  );
  const [stepSize, setStepSize] = useStateFromSearchParamsForPrimitive<number>(
    'stepSize',
    1,
    searchParams,
  );

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
    if (fields && fields.length > 0) {
      const localNumericFields = fields
        .filter(field => field.primitiveType === 'number' || field.primitiveType === 'double')
        .map(field => field.columnName);
      setNumericFields(localNumericFields);
      const localCatFields = fields
        .filter(field => field.canVisualise &&
          (field.primitiveType === 'string' || field.primitiveType === null))
        .map(field => field.columnName);
      setCategoricalFields(localCatFields);
      // Note we do not set a preferred starting colour field; starting value is None
      // Mandatory fields: one numeric field
      if (localNumericFields.length === 0) {
        setPlotErrorMsg('No numeric fields found in project, cannot render plot');
      }
      if (xAxisField === '') {
        setXAxisField(getStartingField(preferredXAxisFields, localNumericFields));
      } else if (!localNumericFields.includes(xAxisField)) {
        setPlotErrorMsg('Invalid field in URL, cannot render plot');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, setPlotErrorMsg]);

  useEffect(() => {
    const addXAxisToSpec = (oldSpec: TopLevelSpec | null): TopLevelSpec | null =>
      setFieldInSpec(oldSpec, 'x', xAxisField);

    if (xAxisField.length > 0) {
      setSpec(addXAxisToSpec);
    }
  }, [xAxisField]);

  useEffect(() => {
    const setColorInSpec = (oldSpec: TopLevelSpec | null): TopLevelSpec | null =>
      setColorInSpecToValue(
        oldSpec,
        colourField,
        fieldUniqueValues![colourField] ?? [],
        colourScheme,
      );

    if (fieldUniqueValues) {
      setSpec(setColorInSpec);
    }
  }, [colourField, colourScheme, fieldUniqueValues]);

  useEffect(() => {
    const addBinningToSpec = (oldSpec: TopLevelSpec | null): TopLevelSpec | null => {
      if (oldSpec == null) return null;
      const newSpec: any = { ...oldSpec };
      if (binMode === 'auto') {
        newSpec.encoding.x.bin = true;
      } else if (binMode === 'fixed') {
        newSpec.encoding.x.bin = { step: stepSize };
      } else {
        // eslint-disable-next-line no-console
        console.error(`Unknown bin mode ${binMode}`);
      }
      return newSpec as TopLevelSpec;
    };

    setSpec(addBinningToSpec);
  }, [binMode, stepSize]);

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
            numericFields.map(field => <MenuItem key={field} value={field}>{field}</MenuItem>)
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
            categoricalFields.map(field => <MenuItem key={field} value={field}>{field}</MenuItem>)
          }
        </Select>
      </FormControl>
      {colourField !== 'none' && (
        <ColorSchemeSelectorPlotStyle
          selectedScheme={colourScheme}
          onColourChange={(newColor) => setColourScheme(newColor)}
        />
      )}
      <FormControl size="small" sx={{ marginX: 1, marginTop: 1 }}>
        <InputLabel id="binning-auto-select-label">Binning</InputLabel>
        <Select
          labelId="binning-auto-select-label"
          id="binning-auto-select"
          value={binMode}
          label="Binning"
          onChange={(e) => setBinMode(e.target.value)}
        >
          <MenuItem value="auto">Auto</MenuItem>
          <MenuItem value="fixed">Fixed</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ marginX: 1, marginTop: 1, width: 80 }}>
        <TextField
          disabled={binMode !== 'fixed'}
          sx={{ padding: 0 }}
          type="number"
          id="date-bin-size-select"
          label="Bin Size"
          size="small"
          inputProps={{ min: 1, step: 'any' }}
          value={stepSize}
          onChange={(e) => setStepSize(parseFloat(e.target.value))}
        />
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

export default Histogram;
