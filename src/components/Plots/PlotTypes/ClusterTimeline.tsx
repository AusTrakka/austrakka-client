import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { TopLevelSpec } from 'vega-lite';
import { ColorScheme } from 'vega';
import { selectProjectMetadataFields } from '../../../app/projectMetadataSlice';
import { useAppSelector } from '../../../app/store';
import { SAMPLE_ID_FIELD } from '../../../constants/metadataConsts';
import PlotTypeProps from '../../../types/plottypeprops.interface';
import { getStartingField, setColorInSpecToValue, setFieldInSpec, setTimeAggregationInSpecToValue } from '../../../utilities/plotUtils';
import VegaDataPlot from '../VegaDataPlot';
import ColorSchemeSelector from '../../Trees/TreeControls/SchemeSelector';
import { ProjectViewField } from '../../../types/dtos';
import { useStateFromSearchParamsForPrimitive } from '../../../utilities/stateUtils';
import { defaultColorSchemeName } from '../../../constants/schemes';

// We will check for these in order in the given dataset, and use the first found as default
// Possible enhancement: allow preferred field to be specified in the database, overriding these
const preferredYAxisFields = ['cgMLST', 'MLST', 'ST', 'Serotype', 'SNP_cluster', 'Lineage_family', 'Jurisdiction'];
const preferredDateFields = ['Date_coll'];

// The opacity to use for points when they are selected, or when all points are selected
// Should match the Vega-lite default for circle marks
const pointOpacity = 0.7;

const defaultTransforms = [
  {
    calculate: '(floor(random()*2)*2-1)*(pow(random(),1.5))',
    as: 'jitter',
  },
];

// Assumed fields here are Date_coll, Seq_ID(SAMPLE_ID_FIELD)
const defaultSpec: TopLevelSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  description: 'Categorical faceted timeline diagram with jitter - e.g. cluster timeline',
  data: { name: 'inputdata' }, // for Vega-Lite an object, for Vega a list of objects
  transform: defaultTransforms,
  width: 'container',
  height: { step: 70 },
  mark: 'circle',
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
    yOffset: { field: 'jitter', type: 'quantitative' }, // Could control padding with eg scale: { range: [5,45] }
    color: {
      field: 'cgMLST',
      scale: { scheme: defaultColorSchemeName as ColorScheme },
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
    'none',
    urlSearchParams,
  );
  const [colourScheme, setColourScheme] = useStateFromSearchParamsForPrimitive<string>(
    'colourScheme',
    defaultColorSchemeName,
    urlSearchParams,
  );
  const [dateFields, setDateFields] = useState<string[]>([]);
  const [dateField, setDateField] = useStateFromSearchParamsForPrimitive<string>(
    'xAxisField',
    '',
    urlSearchParams,
  );
  const [dateBinUnit, setDateBinUnit] = useStateFromSearchParamsForPrimitive<string>(
    'dateBinUnit',
    'yearmonthdate',
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
      const localCatFields : ProjectViewField[] = fields
        .filter(field => field.canVisualise &&
          (field.primitiveType === 'string' || field.primitiveType === null));
      setCategoricalFields(localCatFields.map(field => field.columnName));
      const localDateFields : ProjectViewField[] = fields
        .filter(field => field.primitiveType === 'date');
      setDateFields(localDateFields.map(field => field.columnName));
      // Mandatory fields: one categorical field
      if (localCatFields.length === 0) {
        setPlotErrorMsg('No visualisable categorical fields found in project, cannot render plot');
        return;
      }
      // If the URL does not specify a mandatory field, try to set the preferred field
      if (yAxisField === '') setYAxisField(getStartingField(preferredYAxisFields, localCatFields));
      if (dateField === '') setDateField(getStartingField(preferredDateFields, localDateFields));
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
  
  useEffect(() => {
    const setColorInSpec = (oldSpec: TopLevelSpec | null): TopLevelSpec | null =>
      setColorInSpecToValue(
        oldSpec,
        colourField,
        fieldUniqueValues![colourField] ?? [],
        colourScheme,
        pointOpacity,
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

  useEffect(() => {
    const groupFields: string[] = [];
    if (yAxisField !== 'none') {
      groupFields.push(yAxisField);
    }
    if (colourField !== 'none' && colourField !== yAxisField) {
      groupFields.push(colourField);
    }

    const addTimeAggregationToSpec = (oldSpec: TopLevelSpec | null): TopLevelSpec | null =>
      setTimeAggregationInSpecToValue(
        oldSpec,
        dateBinUnit,
        dateField,
        groupFields,
        defaultTransforms,
      );

    setSpec(addTimeAggregationToSpec);
  }, [dateBinUnit, yAxisField, colourField, dateField]);

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
            categoricalFields.map(field => <MenuItem key={field} value={field}>{field}</MenuItem>)
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
        <ColorSchemeSelector
          selectedScheme={colourScheme}
          onColourChange={(newColor) => setColourScheme(newColor)}
          variant="outlined"
          size="small"
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
            dateFields.map(field => <MenuItem key={field} value={field}>{field}</MenuItem>)
          }
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ marginX: 1, marginTop: 1 }}>
        <InputLabel id="date-bin-unit-select-label">Bin Unit</InputLabel>
        <Select
          labelId="date-bin-unit-select-label"
          id="date-bin-unit-select"
          label="Bin Unit"
          value={dateBinUnit}
          onChange={(e) => {
            setDateBinUnit(e.target.value);
          }}
        >
          {
            [
              <MenuItem key="none" value="none">None</MenuItem>,
              <MenuItem key="yearmonthdate" value="yearmonthdate">Day</MenuItem>,
              <MenuItem key="yearweek" value="yearweek">Week</MenuItem>,
              <MenuItem key="yearmonth" value="yearmonth">Month</MenuItem>,
              <MenuItem key="year" value="year">Year</MenuItem>,
            ]
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
