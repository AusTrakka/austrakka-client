import { Box, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { TopLevelSpec } from 'vega-lite';
import {
  ProjectMetadataState,
  selectProjectMetadata,
  selectProjectMetadataFields,
} from '../../../app/projectMetadataSlice';
import { useAppSelector } from '../../../app/store';
import PlotTypeProps from '../../../types/plottypeprops.interface';
import {
  getStartingField, selectGoodTimeBinUnit,
  setAxisResolutionInSpecToValue,
  setColorInSpecToValue,
  setFieldInSpec,
  setRowInSpecToValue,
} from '../../../utilities/plotUtils';
import VegaDataPlot from '../VegaDataPlot';
import ColorSchemeSelector from '../../Trees/TreeControls/SchemeSelector';
import { ProjectViewField } from '../../../types/dtos';
import { useStateFromSearchParamsForPrimitive } from '../../../utilities/stateUtils';
import { defaultDiscreteColorScheme } from '../../../constants/schemes';
import MetadataLoadingState from '../../../constants/metadataLoadingState';
import { Sample } from '../../../types/sample.interface';
import {useNavigate} from "react-router-dom";

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
  resolve: { // used when a row facet is applied
    scale: {
      x: 'shared',
      y: 'shared',
    },
  },
};

function EpiCurve(props: PlotTypeProps) {
  const { plot, setPlotErrorMsg } = props;
  const [spec, setSpec] = useState<TopLevelSpec | null>(null);
  const navigate = useNavigate();
  const { fields, fieldUniqueValues } = useAppSelector(
    state => selectProjectMetadataFields(state, plot?.projectAbbreviation),
  );
  // This plot also accesses the data itself, to determine an initial date binning
  const data: ProjectMetadataState | null =
    useAppSelector(state => selectProjectMetadata(state, plot?.projectAbbreviation));
  const [dateFields, setDateFields] = useState<string[]>([]);
  const [categoricalFields, setCategoricalFields] = useState<string[]>([]);
  const [dateField, setDateField] = useStateFromSearchParamsForPrimitive<string>(
    'dateField',
    '',
    navigate,
  );
  const [dateBinUnit, setDateBinUnit] = useStateFromSearchParamsForPrimitive<string>(
    'dateBinUnit',
    '',
    navigate,
  );
  const [dateBinStep, setDateBinStep] = useStateFromSearchParamsForPrimitive<number>(
    'dateBinStep',
    1,
    navigate,
  );
  const [colourField, setColourField] = useStateFromSearchParamsForPrimitive<string>(
    'colourField',
    'none',
    navigate,
  );
  const [colourScheme, setColourScheme] = useStateFromSearchParamsForPrimitive<string>(
    'colourScheme',
    defaultDiscreteColorScheme,
    navigate,
  );
  const [rowField, setRowField] = useStateFromSearchParamsForPrimitive<string>(
    'rowField',
    'none',
    navigate,
  );
  const [facetYAxisMode, setFacetYAxisMode] = useStateFromSearchParamsForPrimitive<string>(
    'facetYAxisMode',
    'shared',
    navigate,
  );
  const [facetXAxisMode, setFacetXAxisMode] = useStateFromSearchParamsForPrimitive<string>(
    'facetXAxisMode',
    'shared',
    navigate,
  );
  const [stackType, setStackType] = useStateFromSearchParamsForPrimitive<string>(
    'stackType',
    'zero',
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

  useEffect(() => {
    if (fields && fields.length > 0) {
      const localCatFields : ProjectViewField[] = fields
        .filter(field => field.canVisualise &&
                        (field.primitiveType === 'string' || field.primitiveType === null));
      setCategoricalFields(localCatFields.map(field => field.columnName));
      // Note we do not set a preferred starting colour field; starting value is None
      // Similarly starting value for row facet is None
      const localDateFields : ProjectViewField[] = fields
        .filter(field => field.primitiveType === 'date');
      setDateFields(localDateFields.map(field => field.columnName));
      // Mandatory fields: one date field
      if (localDateFields.length === 0) {
        setPlotErrorMsg('No date fields found in project, cannot render plot');
        return;
      }
      // If the URL does not specify a mandatory field, try to set the preferred field
      if (dateField === '') {
        setDateField(getStartingField(preferredDateFields, localDateFields));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, setPlotErrorMsg]);

  useEffect(() => {
    if (dateBinUnit === '' &&
        dateField !== '' &&
        data?.loadingState === MetadataLoadingState.DATA_LOADED &&
        data!.fields!.some(field => field.columnName === dateField)) {
      // dateBinUnit is not set; try to pick a good value
      // should only occur on first load, otherwise dateBinUnit will already be set
      const bin = selectGoodTimeBinUnit(
        data!.metadata!.map((row: Sample) => row[dateField]),
      );
      setDateBinUnit(bin.unit!);
      setDateBinStep(bin.step!);
    }
    // Do not want to trigger on dateBinUnit; relevant data changes are covered by loadingState
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.loadingState, dateField, setDateBinUnit, setDateBinStep]);

  useEffect(() => {
    const addDateFieldToSpec = (oldSpec: TopLevelSpec | null): TopLevelSpec | null =>
      setFieldInSpec(oldSpec, 'x', dateField);

    if (dateField.length > 0) {
      setSpec(addDateFieldToSpec);
    }
  }, [dateField]);

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
    const setRowInSpec = (oldSpec: TopLevelSpec | null): TopLevelSpec | null =>
      setRowInSpecToValue(oldSpec, rowField);

    setSpec(setRowInSpec);
  }, [rowField]);

  useEffect(() => {
    const setFacetYAxisModeInSpec = (oldSpec: TopLevelSpec | null): TopLevelSpec | null =>
      setAxisResolutionInSpecToValue(oldSpec, 'y', facetYAxisMode);

    setSpec(setFacetYAxisModeInSpec);
  }, [facetYAxisMode]);

  useEffect(() => {
    const setFacetXAxisModeInSpec = (oldSpec: TopLevelSpec | null): TopLevelSpec | null =>
      setAxisResolutionInSpecToValue(oldSpec, 'x', facetXAxisMode);

    setSpec(setFacetXAxisModeInSpec);
  }, [facetXAxisMode]);

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
          onChange={(e) => {
            setDateBinUnit(e.target.value);
          }}
        >
          {
            [
              <MenuItem key="yearmonthdate" value="yearmonthdate">Day (date)</MenuItem>,
              <MenuItem key="yeardayofyear" value="yeardayofyear">Day (of year)</MenuItem>,
              <MenuItem key="yearweek" value="yearweek">Week</MenuItem>,
              <MenuItem key="yearmonth" value="yearmonth">Month</MenuItem>,
              <MenuItem key="year" value="year">Year</MenuItem>,
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
            dateFields.map(field => <MenuItem key={field} value={field}>{field}</MenuItem>)
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
            categoricalFields.map(field => <MenuItem key={field} value={field}>{field}</MenuItem>)
          }
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ marginX: 1, marginTop: 1, width: '9em' }}>
        <InputLabel id="facet-y-axis-select-label">Facet Y-Axes</InputLabel>
        <Select
          labelId="facet-y-axis-select-label"
          id="facet-y-axis-select"
          value={facetYAxisMode}
          label="Facet Y-Axes"
          onChange={(e) => setFacetYAxisMode(e.target.value)}
        >
          <MenuItem value="shared">Shared</MenuItem>
          <MenuItem value="independent">Independent</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ marginX: 1, marginTop: 1, width: '9em' }}>
        <InputLabel id="facet-x-axis-select-label">Facet X-Axes</InputLabel>
        <Select
          labelId="facet-x-axis-select-label"
          id="facet-x-axis-select"
          value={facetXAxisMode}
          label="Facet X-Axes"
          onChange={(e) => setFacetXAxisMode(e.target.value)}
        >
          <MenuItem value="shared">Shared</MenuItem>
          <MenuItem value="independent">Independent</MenuItem>
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
