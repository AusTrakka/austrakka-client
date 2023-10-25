// This implements AusTrakka data retrieval and Vega plot rendering
// Implements elements common to all plot types

import React, { useEffect, useRef, useState } from 'react';
import { parse, View as VegaView } from 'vega';
import { TopLevelSpec, compile } from 'vega-lite';
import { Grid } from '@mui/material';
import { InlineData } from 'vega-lite/build/src/data';
import { ResponseObject, getPlotData } from '../../utilities/resourceUtils';
import ExportVegaPlot from './ExportVegaPlot';
import DataFilters from '../Common/DataFilters';
import { MetaDataColumn } from '../../types/dtos';

interface VegaDataPlotProps {
  spec: TopLevelSpec | null,
  dataGroupId: number | undefined,
  displayFields: MetaDataColumn[],
  fieldsToRetrieve: string[],
  setPlotErrorMsg: Function,
}

function VegaDataPlot(props: VegaDataPlotProps) {
  const { spec, dataGroupId, displayFields, fieldsToRetrieve, setPlotErrorMsg } = props;
  const plotDiv = useRef<HTMLDivElement>(null);
  const [vegaView, setVegaView] = useState<VegaView | null>(null);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filterFields, setFilterFields] = useState<MetaDataColumn[]>([]);

  // Get data on load
  useEffect(() => {
    const updatePlotData = async () => {
      const response = await getPlotData(dataGroupId!, fieldsToRetrieve) as ResponseObject;
      if (response.status === 'Success') {
        setData(response.data);
        setFilteredData(response.data);
      } else {
        // eslint-disable-next-line no-console
        console.error(response.message);
        setPlotErrorMsg('Unable to load plot data');
      }
    };

    // For now get all display fields, but could do ID + dates + categorical
    if (dataGroupId && fieldsToRetrieve && fieldsToRetrieve.length > 0) {
      updatePlotData();
    }
  }, [setPlotErrorMsg, fieldsToRetrieve, dataGroupId, setData]);

  // Render plot by creating vega view
  useEffect(() => {
    const createVegaView = async () => {
      if (vegaView) {
        vegaView.finalize();
      }
      const compiledSpec = compile(spec!).spec;
      const dataIndex: number = compiledSpec!.data!.findIndex(dat => dat.name === 'inputdata');
      (compiledSpec.data![dataIndex] as InlineData).values = filteredData;
      const view = await new VegaView(parse(compiledSpec))
        .initialize(plotDiv.current!)
        .runAsync();
      setVegaView(view);
    };

    // For now we recreate view if data changes, not just if spec changes
    if (spec && filteredData && plotDiv?.current) {
      createVegaView();
    }
  // Review: old vegaView is just being cleaned up and should NOT be a dependency?
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec, filteredData, plotDiv]);

  // Current implementation:
  // For now (while we aren't retrieving all columns), only show (displayFields ∩ fieldsToRetrive)
  useEffect(() => {
    const intersection: MetaDataColumn[] = displayFields.filter((el) =>
      fieldsToRetrieve.includes(el.columnName as string));

    setFilterFields(intersection);
  }, [displayFields, fieldsToRetrieve]);

  return (
    <Grid container direction="column">
      <Grid container item direction="row">
        <Grid item xs={11}>
          <div id="#plot-container" ref={plotDiv} />
        </Grid>
        <Grid item xs={1}>
          <ExportVegaPlot
            vegaView={vegaView}
          />
        </Grid>
      </Grid>
      <Grid item xs={12}>
        <DataFilters
          data={data}
          fields={filterFields}
          setFilteredData={setFilteredData}
        />
      </Grid>
    </Grid>
  );
}

export default VegaDataPlot;
