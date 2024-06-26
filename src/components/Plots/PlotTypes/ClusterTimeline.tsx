import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { TopLevelSpec } from 'vega-lite';
import { selectProjectMetadataFields } from '../../../app/projectMetadataSlice';
import { useAppSelector } from '../../../app/store';
import { SAMPLE_ID_FIELD } from '../../../constants/metadataConsts';
import PlotTypeProps from '../../../types/plottypeprops.interface';
import { getStartingField, setColorInSpecToValue, setFieldInSpec } from '../../../utilities/plotUtils';
import VegaDataPlot from '../VegaDataPlot';
import { ColorSchemeSelectorPlotStyle } from '../../Trees/TreeControls/SchemeSelector';
import { useStateFromSearchParamsForPrimitive } from '../../../utilities/helperUtils';

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
  const { fields, fieldUniqueValues } = useAppSelector(
    state => selectProjectMetadataFields(state, plot?.projectAbbreviation),
  );
  const urlSearchParams = new URLSearchParams(window.location.search);
  // This represents psuedo-ordinal fields: categorical, and string fields with canVisualise=true
  const [categoricalFields, setCategoricalFields] = useState<string[]>([]);
  const [yAxisField, setYAxisField] = useStateFromSearchParamsForPrimitive<string>(
    'yAxisField',
    '',
    urlSearchParams,
  );
  const [colourField, setColourField] = useStateFromSearchParamsForPrimitive<string>(
    'colourField',
    '',
    urlSearchParams,
  );
  const [colourScheme, setColourScheme] = useStateFromSearchParamsForPrimitive<string>(
    'colourScheme',
    'spectral',
    urlSearchParams,
  );
  const [dateFields, setDateFields] = useState<string[]>([]);
  const [dateField, setDateField] = useStateFromSearchParamsForPrimitive<string>(
    'xAxisField',
    '',
    urlSearchParams,
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

  // Get project's total fields and visualisable (psuedo-categorical) fields on load
  useEffect(() => {
    if (fields && fields.length > 0) {
      // Note this does not include numerical or date fields
      // For now this selection need only depend on canVisualise
      const localCatFields = fields
        .filter(field => field.canVisualise &&
          (field.primitiveType === 'string' || field.primitiveType === null))
        .map(field => field.columnName);
      setCategoricalFields(localCatFields);
      const localDateFields = fields
        .filter(field => field.primitiveType === 'date')
        .map(field => field.columnName);
      setDateFields(localDateFields);
      // Mandatory fields: one categorical field
      if (localCatFields.length === 0) {
        setPlotErrorMsg('No visualisable categorical fields found in project, cannot render plot');
        return;
      }
      if (yAxisField === '' || colourField === '' || dateField === '') {
        setYAxisField(getStartingField(preferredYAxisFields, localCatFields));
        setColourField(getStartingField(preferredColourFields, localCatFields));
        setDateField(getStartingField(preferredDateFields, localDateFields));
      } else if (!localCatFields.includes(yAxisField) || !localCatFields.includes(colourField)
        || !localDateFields.includes(dateField)) {
        setPlotErrorMsg('Invalid field in URL, cannot render plot');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {colourField !== 'none' && (
        <ColorSchemeSelectorPlotStyle
          selectedScheme={colourScheme}
          onColourChange={(newColor) => setColourScheme(newColor)}
        />
      )}
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
