import React, { useEffect, useRef, useState } from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { compile, TopLevelSpec } from 'vega-lite';
import { parse, View as VegaView } from 'vega';
import Grid from '@mui/material/Grid2';
import { DataTableFilterMeta } from 'primereact/datatable';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { InlineData } from 'vega-lite/build/src/data';
import { useAppSelector } from '../../../app/store';
import { ProjectMetadataState, selectProjectMetadata } from '../../../app/projectMetadataSlice';
import MetadataLoadingState from '../../../constants/metadataLoadingState';
import LoadingState from '../../../constants/loadingState';
import ProjectWidgetProps from '../../../types/projectwidget.props';
import ExportVegaPlot from '../../Plots/ExportVegaPlot';
import { updateTabUrlWithSearch } from '../../../utilities/navigationUtils';
import getComputedColor from '../../../utilities/vegaColourUtils';

const ORG_FIELD_NAME = 'Owner_group';
const ORG_FIELD_PLOTNAME = 'Owner_organisation';
const DATE_COLUMN = 'Date_coll';

export default function DateCollCounts(props: ProjectWidgetProps) {
  const { projectAbbrev, filteredData, timeFilterObject } = props;
  const data: ProjectMetadataState | null = useAppSelector(state =>
    selectProjectMetadata(state, projectAbbrev));
  const plotDiv = useRef<HTMLDivElement>(null);
  const [vegaView, setVegaView] = useState<VegaView | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const CHART_COLORS = {
    AVAILABLE: getComputedColor('--secondary-main'),
    MISSING: getComputedColor('--primary-grey-300'),
  } as const;
  
  const dateStatusTransform = {
    calculate: `datum['${DATE_COLUMN}'] ? 'Available' : 'Missing'`,
    as: `${DATE_COLUMN}_status`,
  };
  
  const createSpec = () => ({
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { name: 'inputdata' },
    transform: [
      { calculate: `split(datum['${ORG_FIELD_NAME}'],'-Owner')[0]`, as: ORG_FIELD_PLOTNAME },
      dateStatusTransform,
    ],
    width: 'container',
    height: 250,
    layer: [{
      mark: { type: 'bar', tooltip: true, cursor: 'pointer', size: 40 },
      encoding: {
        x: {
          aggregate: 'count',
          stack: 'zero',
          axis: { title: 'Count' },
        },
        y: {
          field: ORG_FIELD_PLOTNAME,
          axis: { title: 'Organisation' },
        },
        color: {
          field: `${DATE_COLUMN}_status`,
          scale: {
            domain: ['Available', 'Missing'],
            range: [CHART_COLORS.AVAILABLE, CHART_COLORS.MISSING],
          },
          legend: { title: 'Date collection status', orient: 'bottom' },
        },
      },
    },
    {
      mark: { type: 'text', color: 'black', tooltip: true, cursor: 'pointer' },
      encoding: {
        text: { aggregate: 'count' },
        x: {
          aggregate: 'count',
          stack: 'zero',
          bandPosition: 0.5,
        },
        y: { field: ORG_FIELD_PLOTNAME },
        detail: {
          field: `${DATE_COLUMN}_status`,
        },
      },
    }],
    title: {
      text: `${DATE_COLUMN} counts`,
      anchor: 'middle',
      fontSize: 12,
    },
    usermeta: {
      dateCollField: DATE_COLUMN,
    },
  });

  useEffect(() => {
    if (data?.loadingState && (
      data.loadingState === MetadataLoadingState.FIELDS_LOADED ||
            data.loadingState === MetadataLoadingState.DATA_LOADED
    )) {
      const fields = data.fields!.map(field => field.columnName);
      if (!fields.includes(ORG_FIELD_NAME)) {
        setErrorMessage(`Field ${ORG_FIELD_NAME} not found in project`);
      } else if (!fields.includes(DATE_COLUMN)) {
        setErrorMessage('No date collection field found in project');
      }
    }
  }, [data]);

  useEffect(() => {
    const createVegaViews = async () => {
      // Cleanup existing views
      if (vegaView) {
        vegaView.finalize();
      }

      const spec = createSpec();
      const compiledSpec = compile(spec as TopLevelSpec).spec;
      const copy = filteredData!.map((item: any) => ({ ...item }));
      (compiledSpec.data![0] as InlineData).values = copy;
      
      const view = await new VegaView(parse(compiledSpec))
        .initialize(plotDiv.current!)
        .addEventListener('click', (_, item) => {
          if (!item || !item.datum) return;
          const status = item.datum[`${DATE_COLUMN}_status`];
          const org = item.datum[ORG_FIELD_PLOTNAME];
          const drillDownTableMetaFilters: DataTableFilterMeta = {
            [DATE_COLUMN]: {
              operator: FilterOperator.AND,
              constraints: [
                {
                  matchMode: FilterMatchMode.CUSTOM,
                  value: status !== 'Available',
                },
              ],
            },
            [ORG_FIELD_NAME]: {
              operator: FilterOperator.AND,
              constraints: [
                {
                  matchMode: FilterMatchMode.EQUALS,
                  value: `${org}-Owner`,
                },
              ],
            },
          };
          if (timeFilterObject && Object.keys(timeFilterObject).length !== 0) {
            const combinedFilters: DataTableFilterMeta = {
              ...drillDownTableMetaFilters,
              ...timeFilterObject,
            };
            updateTabUrlWithSearch(navigate, '/samples', combinedFilters);
          } else {
            updateTabUrlWithSearch(navigate, '/samples', drillDownTableMetaFilters);
          }
        }).runAsync();
      setVegaView(view);
    };

    if (filteredData && plotDiv?.current) {
      createVegaViews();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredData, plotDiv, projectAbbrev, navigate]);

  useEffect(() => {
    if (data?.fields && !data.fields.map(fld => fld.columnName).includes(ORG_FIELD_NAME)) {
      setErrorMessage(`Field ${ORG_FIELD_NAME} not found in project`);
    } else if (data?.loadingState === MetadataLoadingState.ERROR) {
      setErrorMessage(data.errorMessage);
    } else if (data?.fieldLoadingStates[ORG_FIELD_NAME] === LoadingState.ERROR) {
      setErrorMessage(`Error loading ${ORG_FIELD_NAME} values`);
    }
  }, [data]);

  return (
    <Box>
      <Typography variant="h5" paddingBottom={3} color="primary">
        Date collection counts
      </Typography>
      {errorMessage ? (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {errorMessage}
        </Alert>
      ) :
        (data?.fieldLoadingStates[ORG_FIELD_NAME] === LoadingState.SUCCESS && (
        <Grid container spacing={2}>
          <Grid size={11}>
            <div
              id="#plot-container"
              ref={plotDiv}
              style={{ width: '100%' }}
            />
          </Grid>
          <Grid size={1}>
            <ExportVegaPlot vegaView={vegaView} />
          </Grid>
        </Grid>
        ))}
      {(!(data?.loadingState) ||
                !(data.loadingState === MetadataLoadingState.DATA_LOADED ||
                    data.loadingState === MetadataLoadingState.ERROR ||
                    data.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR)) && (
                    <div>Loading...</div>
      )}
    </Box>
  );
}
