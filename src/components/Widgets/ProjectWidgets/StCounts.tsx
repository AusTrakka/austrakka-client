import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { Column } from 'primereact/column';
import {
  DataTable,
  type DataTableFilterMeta,
  type DataTableRowClickEvent,
} from 'primereact/datatable';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parse, View as VegaView } from 'vega';
import { compile, type TopLevelSpec } from 'vega-lite';
import type { InlineData } from 'vega-lite/types_unstable/data.js';
import {
  type ProjectMetadataState,
  selectProjectMetadata,
} from '../../../app/projectMetadataSlice';
import { useAppSelector } from '../../../app/store';
import LoadingState from '../../../constants/loadingState';
import MetadataLoadingState, { hasCompleteData } from '../../../constants/metadataLoadingState';
import type ProjectWidgetProps from '../../../types/projectwidget.props';
import {
  aggregateArrayObjects,
  type CountRow,
  pruneColumns,
} from '../../../utilities/dataProcessingUtils';
import { updateTabUrlWithSearch } from '../../../utilities/navigationUtils';
import { legendSpec } from '../../../utilities/plotUtils';
import ExportVegaPlot from '../../Plots/ExportVegaPlot';

// May want to parametrise field to make widget more flexible
const stFieldName = 'ST';
const DATE_FIELD = 'Date_coll';

function STChart(props: any) {
  const { stData, stDataAggregated } = props;
  const plotDiv = useRef<HTMLDivElement>(null);
  const [vegaView, setVegaView] = useState<VegaView | null>(null);

  const spec: TopLevelSpec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      name: 'inputdata',
    },
    width: 'container',
    height: 350,
    mark: { type: 'bar', tooltip: true },
    encoding: {
      x: {
        field: DATE_FIELD,
        type: 'temporal',
        title: `Sample collected date (${DATE_FIELD})`,
        bin: { maxbins: 20 },
        axis: { format: ' %d %b %Y' },
      },
      y: { aggregate: 'count', title: 'Count of Samples' },
      color: {
        field: stFieldName,
        title: `${stFieldName} Value`,
        // NB not currently using defaultColorSchemeName
        scale: {
          scheme: stDataAggregated && stDataAggregated.length > 10 ? 'category20' : 'category10',
        },
        legend: {
          ...(legendSpec as object),
          columns: 15,
        },
      },
    },
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: historic
  useEffect(() => {
    const createVegaView = async () => {
      if (vegaView) {
        vegaView.finalize();
      }
      const compiledSpec = compile(spec!).spec;
      const pruned = pruneColumns(stData!, [DATE_FIELD, stFieldName]);
      const copy = pruned.map((item: any) => ({
        ...item,
      }));
      (compiledSpec.data![0] as InlineData).values = copy;
      const view = await new VegaView(parse(compiledSpec)).initialize(plotDiv.current!).runAsync();
      setVegaView(view);
    };

    if (stData && plotDiv?.current) {
      createVegaView();
    }
  }, [stData, plotDiv]);

  return (
    <Grid container direction="row">
      <Grid size={11}>
        <div id="#plot-container" ref={plotDiv} />
      </Grid>
      <Grid size={1}>
        <ExportVegaPlot vegaView={vegaView} />
      </Grid>
    </Grid>
  );
}

export default function StCounts(props: ProjectWidgetProps) {
  const { projectAbbrev, filteredData, timeFilterObject } = props;
  const data: ProjectMetadataState | null = useAppSelector((state) =>
    selectProjectMetadata(state, projectAbbrev),
  );
  const [aggregatedCounts, setAggregatedCounts] = useState<CountRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigation = useNavigate();

  useEffect(() => {
    if (data?.fieldLoadingStates[stFieldName] === LoadingState.SUCCESS) {
      const counts = aggregateArrayObjects(stFieldName, filteredData!) as CountRow[];
      setAggregatedCounts(counts);
    }
  }, [filteredData, data?.fieldLoadingStates]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: redundant dependencies
  useEffect(() => {
    if (data?.fields && !data.fields.map((fld) => fld.columnName).includes(stFieldName)) {
      setErrorMessage(`Field ${stFieldName} not found in project`);
    } else if (data?.loadingState === MetadataLoadingState.ERROR) {
      setErrorMessage(data.errorMessage);
    } else if (data?.fieldLoadingStates[stFieldName] === LoadingState.ERROR) {
      setErrorMessage(`Error loading ${stFieldName} values`);
    }
  }, [data?.fields, data?.loadingState, data?.fieldLoadingStates]);

  const rowClickHandler = (row: DataTableRowClickEvent) => {
    const selectedRow = row.data;

    const drilldownFilter: DataTableFilterMeta = {
      [stFieldName]: {
        operator: FilterOperator.AND,
        constraints: [
          {
            matchMode: FilterMatchMode.EQUALS,
            value: selectedRow[stFieldName],
          },
        ],
      },
    };
    // Append timeFilterObject for last_week and last_month filters
    if (timeFilterObject && Object.keys(timeFilterObject).length !== 0) {
      const appendedFilters: DataTableFilterMeta = {
        ...drilldownFilter,
        ...timeFilterObject,
      };
      updateTabUrlWithSearch(navigation, '/samples', appendedFilters);
    } else {
      updateTabUrlWithSearch(navigation, '/samples', drilldownFilter);
    }
  };

  const columns = useMemo<any[]>(
    () => [
      { field: 'value', header: `${stFieldName} Value` },
      { field: 'count', header: 'Sample count' },
    ],
    [],
  );

  return (
    // <Box sx={{ flexGrow: 1 }}>
    <Box>
      <Typography variant="h5" paddingBottom={1} color="primary">
        {stFieldName} Counts
      </Typography>
      {hasCompleteData(data?.loadingState) && !errorMessage && (
        <Grid container direction="row" alignItems="flex-start" spacing={2}>
          <Grid size={{ lg: 3, md: 4, xs: 12 }}>
            <DataTable
              value={aggregatedCounts}
              size="small"
              selectionMode="single"
              onRowClick={rowClickHandler}
              scrollable
              scrollHeight="500px"
            >
              {columns.map((col: any) => (
                <Column key={col.field} field={col.field} header={col.header} />
              ))}
            </DataTable>
          </Grid>
          <Grid size={{ lg: 9, md: 8, xs: 12 }}>
            <STChart stData={filteredData} stDataAggregated={aggregatedCounts} />
          </Grid>
        </Grid>
      )}
      {errorMessage && (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {errorMessage}
        </Alert>
      )}
      {!hasCompleteData(data?.loadingState) && <div>Loading...</div>}
    </Box>
  );
}
