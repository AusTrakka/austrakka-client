import { Box, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
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
  const { customSpec, projectAbbrev, setPlotErrorMsg } = props;
  const [spec, setSpec] = useState<TopLevelSpec | null>(null);
  const { fields, fieldUniqueValues } = useAppSelector((state) =>
    selectProjectMetadataFields(state, projectAbbrev),
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
  const [fontSize, setFontSize] = useStateFromSearchParamsForPrimitive<number>(
    'fontSize',
    11,
    navigate,
  );

  // Set spec on load
  useEffect(() => {
    if (customSpec && customSpec.length > 0) {
      setSpec(JSON.parse(customSpec) as TopLevelSpec);
    } else {
      setSpec(defaultSpec);
    }
  }, [customSpec]);

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

  useEffect(() => {
    const setFontSizeInSpec = (oldSpec: TopLevelSpec | null): TopLevelSpec | null => {
      if (oldSpec === null) return null;
      const newSpec: any = { ...oldSpec };
      newSpec.config = {
        ...oldSpec.config,
        axis: { ...oldSpec.config?.axis, labelFontSize: fontSize, titleFontSize: fontSize },
        legend: { ...oldSpec.config?.legend, labelFontSize: fontSize, titleFontSize: fontSize },
        header: { ...oldSpec.config?.header, labelFontSize: fontSize, titleFontSize: fontSize },
      };

      return newSpec as TopLevelSpec;
    };

    setSpec(setFontSizeInSpec);
  }, [fontSize]);

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
      <FormControl size="small" sx={{ marginX: 1, marginTop: 1, width: 80 }}>
        <TextField
          sx={{ padding: 0 }}
          type="number"
          id="font-size-select"
          label="Font Size"
          size="small"
          inputProps={{ min: 6, max: 24, step: 1 }}
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value, 10) || 11)}
        />
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
      <VegaDataPlot spec={spec} projectAbbrev={projectAbbrev} />
    </>
  );
}

export default HeatMap;
