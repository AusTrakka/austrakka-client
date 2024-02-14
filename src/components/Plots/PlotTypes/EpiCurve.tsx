import { Box, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { TopLevelSpec } from 'vega-lite';
import { selectProjectMetadataFields } from '../../../app/projectMetadataSlice';
import { useAppSelector } from '../../../app/store';
import PlotTypeProps from '../../../types/plottypeprops.interface';
import {
  getStartingField, setColorInSpecToValue,
  setFieldInSpec,
  setRowInSpecToValue,
} from '../../../utilities/plotUtils';
import VegaDataPlot from '../VegaDataPlot';

// We will check for these in order in the given dataset, and use the first found as default
// Possible enhancement: allow preferred field to be specified in the database, overriding these
const preferredDateFields = ['Date_coll'];

const defaultSpec: TopLevelSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  description: 'A bar chart with samples binned by date (epi curve).',
  data: { name: 'inputdata' },
  width: 'container',
  mark: { type: 'bar', tooltip: true },
  encoding: {
    x: {
      timeUnit: {
        unit: 'yearmonthdate',
        step: 1,
      },
      field: 'Date_coll',
      type: 'temporal',
    },
    y: {
      aggregate: 'count',
      stack: 'zero',
    },
  },
};

function EpiCurve(props: PlotTypeProps) {
  const { plot, setPlotErrorMsg } = props;
  const [spec, setSpec] = useState<TopLevelSpec | null>(null);
  const { fields } = useAppSelector(
    state => selectProjectMetadataFields(state, plot?.projectAbbreviation),
  );
  const [dateFields, setDateFields] = useState<string[]>([]);
  const [categoricalFields, setCategoricalFields] = useState<string[]>([]);
  const [dateField, setDateField] = useState<string>('');
  const [dateBinUnit, setDateBinUnit] = useState<string>('yearmonthdate');
  const [dateBinStep, setDateBinStep] = useState<number>(1);
  const [colourField, setColourField] = useState<string>('none');
  const [rowField, setRowField] = useState<string>('none'); // facets by row
  const [stackType, setStackType] = useState<string>('zero');

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
      const localCatFields = fields
        .filter(field => field.canVisualise &&
                        (field.fieldDataType === 'string' || field.fieldDataType === null))
        .map(field => field.fieldName);
      setCategoricalFields(localCatFields);
      // Note we do not set a preferred starting colour field; starting value is None
      // Similarly starting value for row facet is None
      const localDateFields = fields
        .filter(field => field.fieldDataType === 'date')
        .map(field => field.fieldName);
      setDateFields(localDateFields);
      // Mandatory fields: one date field
      if (localDateFields.length === 0) {
        setPlotErrorMsg('No date fields found in project, cannot render plot');
        return;
      }
      setDateField(getStartingField(preferredDateFields, localDateFields));
    }
  }, [fields, setPlotErrorMsg]);

  useEffect(() => {
    const addDateFieldToSpec = (oldSpec: TopLevelSpec | null): TopLevelSpec | null =>
      setFieldInSpec(oldSpec, 'x', dateField);

    if (dateField.length > 0) {
      setSpec(addDateFieldToSpec);
    }
  }, [dateField]);

  useEffect(() => {
    const setColorInSpec = (oldSpec: TopLevelSpec | null): TopLevelSpec | null =>
      setColorInSpecToValue(oldSpec, colourField);

    setSpec(setColorInSpec);
  }, [colourField]);

  useEffect(() => {
    const setRowInSpec = (oldSpec: TopLevelSpec | null): TopLevelSpec | null =>
      setRowInSpecToValue(oldSpec, rowField);

    setSpec(setRowInSpec);
  }, [rowField]);

  useEffect(() => {
    const setDateBinningInSpec = (oldSpec: TopLevelSpec | null): TopLevelSpec | null => {
      if (oldSpec === null) return null;
      const newSpec: any = { ...oldSpec };
      newSpec.encoding = { ...(oldSpec as any).encoding };
      newSpec.encoding.x = { ...(oldSpec as any).encoding.x };
      newSpec.encoding.x.timeUnit = { unit: dateBinUnit, step: dateBinStep };

      return newSpec as TopLevelSpec;
    };

    // Restriction of step to numbers >= 1 appears to be handled by control
    setSpec(setDateBinningInSpec);
  }, [dateBinStep, dateBinUnit]);

  useEffect(() => {
    const setStackTypeInSpec = (oldSpec: TopLevelSpec | null): TopLevelSpec | null => {
      if (oldSpec === null) return null;
      const newSpec: any = { ...oldSpec };

      newSpec.encoding = { ...(oldSpec as any).encoding };
      newSpec.encoding.y = { ...(oldSpec as any).encoding.y };
      newSpec.encoding.y.stack = stackType;

      return newSpec as TopLevelSpec;
    };

    setSpec(setStackTypeInSpec);
  }, [stackType]);

  const renderControls = () => (
    <Box sx={{ float: 'right', marginX: 10 }}>
      <FormControl size="small" sx={{ marginX: 1, marginTop: 1, width: 80 }}>
        <TextField
          sx={{ padding: 0 }}
          type="number"
          id="date-bin-size-select"
          label="Bin Size"
          size="small"
          inputProps={{ min: 1 }}
          value={dateBinStep}
          onChange={(e) => setDateBinStep(parseInt(e.target.value, 10))}
        />
      </FormControl>
      <FormControl size="small" sx={{ marginX: 1, marginTop: 1 }}>
        <InputLabel id="date-bin-unit-select-label">Bin Unit</InputLabel>
        <Select
          labelId="date-bin-unit-select-label"
          id="date-bin-unit-select"
          label="Bin Unit"
          value={dateBinUnit}
          onChange={(e) => { setDateBinUnit(e.target.value); }}
        >
          {
            [
              <MenuItem value="yearmonthdate">Day (date)</MenuItem>,
              <MenuItem value="yeardayofyear">Day (of year)</MenuItem>,
              <MenuItem value="yearweek">Week</MenuItem>,
              <MenuItem value="yearmonth">Month</MenuItem>,
              <MenuItem value="year">Year</MenuItem>,
            ]
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
      <FormControl size="small" sx={{ marginX: 1, marginTop: 1 }}>
        <InputLabel id="row-facet-select-label">Row facet</InputLabel>
        <Select
          labelId="row-facet-select-label"
          id="row-facet-select"
          value={rowField}
          label="Row facet"
          onChange={(e) => setRowField(e.target.value)}
        >
          <MenuItem value="none">None</MenuItem>
          {
            categoricalFields.map(field => <MenuItem value={field}>{field}</MenuItem>)
          }
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ marginX: 1, marginTop: 1 }}>
        <InputLabel id="stack-type-select-label">Chart type</InputLabel>
        <Select
          labelId="stack-type-select-label"
          id="stack-type-select"
          value={stackType}
          label="Chart type"
          onChange={(e) => setStackType(e.target.value)}
        >
          <MenuItem value="zero">Stacked</MenuItem>
          <MenuItem value="normalize">Proportional</MenuItem>
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

export default EpiCurve;
