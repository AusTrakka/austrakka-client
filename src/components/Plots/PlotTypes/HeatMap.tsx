import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColorScheme } from 'vega';
import type { TopLevelSpec } from 'vega-lite';
import { selectProjectMetadataFields } from '../../../app/projectMetadataSlice';
import { useAppSelector } from '../../../app/store';
import { defaultContinuousColorScheme } from '../../../constants/schemes';
import type { ProjectViewField } from '../../../types/dtos';
import type PlotTypeProps from '../../../types/plottypeprops.interface';
import {
  getStartingField,
  setColorAggregateInSpecToValue,
  setFieldInSpec,
} from '../../../utilities/plotUtils';
import { useStateFromSearchParamsForPrimitive } from '../../../utilities/stateUtils';
import ColorSchemeSelector from '../../Trees/TreeControls/SchemeSelector';
import VegaDataPlot from '../VegaDataPlot';

// We will check for these in order in the given dataset, and use the first found as default
// Possible enhancement: allow preferred field to be specified in the database, overriding these
const preferredCatFields = [
  'cgMLST',
  'MLST',
  'ST',
  'Serotype',
  'SNP_cluster',
  'Lineage_family',
  'Jurisdiction',
];

const defaultSpec: TopLevelSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  description: 'A generic bar chart with selectable categorical axis.',
  data: { name: 'inputdata' },
  width: 'container',
  mark: { type: 'bar', tooltip: true },
  encoding: {
    x: {
      field: '', // must be replaced
      type: 'nominal',
    },
    y: {
      field: '', // must be replaced
      type: 'nominal',
    },
    color: {
      aggregate: 'count',
      type: 'nominal',
      scale: {
        scheme: defaultContinuousColorScheme as ColorScheme,
      },
    },
  },
};

function HeatMap(props: PlotTypeProps) {
  const { plot, setPlotErrorMsg } = props;
  const [spec, setSpec] = useState<TopLevelSpec | null>(null);
  const { fields, fieldUniqueValues } = useAppSelector((state) =>
    selectProjectMetadataFields(state, plot?.projectAbbreviation),
  );
  const [categoricalFields, setCategoricalFields] = useState<string[]>([]);
  const navigate = useNavigate();
  const [xAxisField, setXAxisField] = useStateFromSearchParamsForPrimitive<string>(
    'xAxisField',
    '',
    navigate,
  );
  const [yAxisField, setYAxisField] = useStateFromSearchParamsForPrimitive<string>(
    'yAxisField',
    '',
    navigate,
  );
  const [colourScheme, setColourScheme] = useStateFromSearchParamsForPrimitive<string>(
    'colourScheme',
    defaultContinuousColorScheme,
    navigate,
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: historic
  useEffect(() => {
    if (fields && fields.length > 0) {
      const localCatFields: ProjectViewField[] = fields.filter(
        (field) =>
          field.canVisualise && (field.primitiveType === 'string' || field.primitiveType === null),
      );
      setCategoricalFields(localCatFields.map((field) => field.columnName));
      // Mandatory fields: one categorical field
      if (localCatFields.length === 0) {
        setPlotErrorMsg('No visualisable categorical fields found in project, cannot render plot');
      }
      // If the URL does not specify a mandatory field, try to set the preferred field
      if (xAxisField === '') {
        setXAxisField(getStartingField(preferredCatFields, localCatFields));
      }
      if (yAxisField === '') {
        // This will still set y=x if x is the only field; we just prefer y!=x
        setYAxisField(
          getStartingField(
            preferredCatFields.filter((fld) => !(fld === xAxisField)),
            localCatFields,
          ),
        );
      }
    }
  }, [fields, setPlotErrorMsg]);

  useEffect(() => {
    const addXAxisToSpec = (oldSpec: TopLevelSpec | null): TopLevelSpec | null =>
      setFieldInSpec(oldSpec, 'x', xAxisField);

    if (xAxisField.length > 0) {
      setSpec(addXAxisToSpec);
    }
  }, [xAxisField]);

  useEffect(() => {
    // TODO this will not currently set a domain of 0-max
    const setColorInSpec = (oldSpec: TopLevelSpec | null): TopLevelSpec | null =>
      setColorAggregateInSpecToValue(oldSpec, colourScheme);

    if (fieldUniqueValues) {
      setSpec(setColorInSpec);
    }
  }, [colourScheme, fieldUniqueValues]);

  useEffect(() => {
    const addYAxisToSpec = (oldSpec: TopLevelSpec | null): TopLevelSpec | null =>
      setFieldInSpec(oldSpec, 'y', yAxisField);

    if (yAxisField.length > 0) {
      setSpec(addYAxisToSpec);
    }
  }, [yAxisField]);

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
          {categoricalFields.map((field) => (
            <MenuItem key={field} value={field}>
              {field}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ marginX: 1, marginTop: 1 }}>
        <InputLabel id="y-axis-select-label">Y-Axis</InputLabel>
        <Select
          labelId="y-axis-select-label"
          id="y-axis-select"
          value={yAxisField}
          label="Y-Axis"
          onChange={(e) => setYAxisField(e.target.value)}
        >
          {categoricalFields.map((field) => (
            <MenuItem key={field} value={field}>
              {field}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <ColorSchemeSelector
        selectedScheme={colourScheme}
        onColourChange={(newColor) => setColourScheme(newColor)}
        variant="standard"
        size="small"
      />
    </Box>
  );

  return (
    <>
      {renderControls()}
      <VegaDataPlot spec={spec} projectAbbrev={plot?.projectAbbreviation} />
    </>
  );
}

export default HeatMap;
