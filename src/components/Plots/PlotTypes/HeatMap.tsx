import React, { useState, useEffect } from 'react';
import { TopLevelSpec } from 'vega-lite';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { MetaDataColumn } from '../../../types/dtos';
import { getDisplayFields } from '../../../utilities/resourceUtils';
import { getStartingField, setFieldInSpec } from '../../../utilities/plotUtils';
import PlotTypeProps from '../../../types/plottypeprops.interface';
import VegaDataPlot from '../VegaDataPlot';
import { SAMPLE_ID_FIELD } from '../../../constants/metadataConsts';
import { useApi } from '../../../app/ApiContext';
import LoadingState from '../../../constants/loadingState';
import { ResponseObject } from '../../../types/responseObject.interface';
import { ResponseType } from '../../../constants/responseType';

// We will check for these in order in the given dataset, and use the first found as default
// Possible enhancement: allow preferred field to be specified in the database, overriding these
const preferredCatFields = ['cgMLST', 'ST', 'SNP_cluster', 'Lineage_family'];

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
    },
  },
};

function HeatMap(props: PlotTypeProps) {
  const { plot, setPlotErrorMsg } = props;
  const [spec, setSpec] = useState<TopLevelSpec | null>(null);
  const [fieldsToRetrieve, setFieldsToRetrieve] = useState<string[]>([]);
  const [displayFields, setDisplayFields] = useState<MetaDataColumn[]>([]);
  const [categoricalFields, setCategoricalFields] = useState<string[]>([]);
  const [xAxisField, setXAxisField] = useState<string>('');
  const [yAxisField, setYAxisField] = useState<string>('');
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

  useEffect(() => {
    const updateFields = async () => {
      const response = await getDisplayFields(plot!.projectGroupId, token) as ResponseObject;
      if (response.status === ResponseType.Success) {
        const fields = response.data as MetaDataColumn[];
        setDisplayFields(fields);
        const localCatFields = fields
          .filter(field => field.canVisualise &&
            (field.primitiveType === 'string' || field.primitiveType === null))
          .map(field => field.columnName);
        setCategoricalFields(localCatFields);
        // Mandatory fields: one categorical field
        if (localCatFields.length === 0) {
          setPlotErrorMsg('No visualisable categorical fields found in project, cannot render plot');
        }
        const x = getStartingField(preferredCatFields, localCatFields);
        setXAxisField(x);
        // This will still set y=x if x is the only field; we just prefer y!=x
        setYAxisField(getStartingField(
          preferredCatFields.filter(fld => !(fld === x)),
          localCatFields,
        ));
        setFieldsToRetrieve([SAMPLE_ID_FIELD, ...localCatFields]);
      } else {
        // eslint-disable-next-line no-console
        console.error(response.message);
        setPlotErrorMsg('Unable to load project fields');
      }
    };

    if (plot &&
      tokenLoading !== LoadingState.LOADING &&
      tokenLoading !== LoadingState.IDLE) {
      updateFields();
    }
  }, [plot, token, tokenLoading, setPlotErrorMsg]);

  useEffect(() => {
    const addXAxisToSpec = (oldSpec: TopLevelSpec | null): TopLevelSpec | null =>
      setFieldInSpec(oldSpec, 'x', xAxisField);

    if (xAxisField.length > 0) {
      setSpec(addXAxisToSpec);
    }
  }, [xAxisField]);

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
          {
            categoricalFields.map(field => <MenuItem value={field}>{field}</MenuItem>)
          }
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
        displayFields={displayFields}
        setPlotErrorMsg={setPlotErrorMsg}
      />
    </>
  );
}

export default HeatMap;
