import React, { useEffect, useRef, useState } from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { compile, TopLevelSpec } from 'vega-lite';
import { parse, View as VegaView } from 'vega';
import Grid from '@mui/material/Grid2';
import { DataTableFilterMeta } from 'primereact/datatable';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { useAppSelector } from '../../../app/store';
import { ProjectMetadataState, selectProjectMetadata } from '../../../app/projectMetadataSlice';
import MetadataLoadingState from '../../../constants/metadataLoadingState';
import LoadingState from '../../../constants/loadingState';
import ProjectWidgetProps from '../../../types/projectwidget.props';
import { Field } from '../../../types/dtos';
import ExportVegaPlot from '../../Plots/ExportVegaPlot';
import { updateTabUrlWithSearch } from '../../../utilities/navigationUtils';

const ORG_FIELD_NAME = 'Owner_group';
const ORG_FIELD_PLOTNAME = 'Owner_organisation';
const ACCESSION_FIELDS = ['Reads_accession', 'Assembly_accession'];

export default function AccessionCounts(props: ProjectWidgetProps) {
  const { projectAbbrev, filteredData, timeFilterObject } = props;
  const data: ProjectMetadataState | null = useAppSelector(state =>
    selectProjectMetadata(state, projectAbbrev));
  const plotRefs = useRef<(HTMLDivElement | null)[]>([null, null]);
  const [vegaViews, setVegaViews] = useState<(VegaView | null)[]>([null, null]);
  const [accessionFields, setAccessionFields] = useState<Field[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const CHART_COLORS = {
    AVAILABLE: import.meta.env.VITE_THEME_SECONDARY_MAIN,
    MISSING: import.meta.env.VITE_THEME_PRIMARY_GREY_300,
  } as const;

  const fieldTransforms = accessionFields.map(field => ({
    calculate: `datum['${field.columnName}'] ? 'Available' : 'Missing'`,
    as: `${field.columnName}_status`,
  }));
  
  function handleItemClick(item: any, field: Field) {
    if (!item || !item.datum) return;
    const status = item.datum[`${field.columnName}_status`];
    const org = item.datum[ORG_FIELD_PLOTNAME];
    const drillDownTableMetaFilters: DataTableFilterMeta = {
      [field.columnName]: {
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
  }

  const createSpec = (accField: string, legend: boolean = true) => ({
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { name: 'inputdata' },
    transform: [
      { calculate: `split(datum['${ORG_FIELD_NAME}'],'-Owner')[0]`, as: ORG_FIELD_PLOTNAME },
      ...fieldTransforms,
    ],
    width: 'container',
    height: { step: 40 },
    layer: [{
      mark: { type: 'bar', tooltip: true, cursor: 'pointer' },
      encoding: {
        x: {
          aggregate: 'count',
          axis: { title: 'Count' },
        },
        y: {
          field: ORG_FIELD_PLOTNAME,
          axis: { title: 'Organisation' },
        },
        color: {
          field: `${accField}_status`,
          scale: {
            domain: ['Available', 'Missing'],
            range: [CHART_COLORS.AVAILABLE, CHART_COLORS.MISSING],
          },
          legend: legend ? { title: 'Accession status', orient: 'bottom' } : null,
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
          field: `${accField}_status`,
        },
      },
    }],
    title: {
      text: `${accField} counts`,
      anchor: 'middle',
      fontSize: 12,
    },
    usermeta: {
      accessionField: accField,
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
      } else if (!fields.some(field => ACCESSION_FIELDS.includes(field))) {
        setErrorMessage('No accession fields found in project');
      } else {
        setAccessionFields(
          data!.fields!.filter(field => ACCESSION_FIELDS.includes(field.columnName)),
        );
      }
    }
  }, [data]);

  useEffect(() => {
    const createVegaViews = async () => {
      // Cleanup existing views
      vegaViews.forEach(view => view?.finalize());

      const newViews = await Promise.all(accessionFields.map(async (field, index) => {
        if (!plotRefs.current[index]) return null;
        
        const spec = createSpec(field.columnName, index === 0);
        const compiledSpec = compile(spec as TopLevelSpec).spec;
        const copy = filteredData!.map((item: any) => ({ ...item }));
        (compiledSpec.data![0] as any).values = copy;

        const view = new VegaView(parse(compiledSpec))
          .initialize(plotRefs.current[index]!)
          .addEventListener('click', (_, item) => handleItemClick(item, field));

        await view.runAsync();
        return view;
      }));

      setVegaViews(newViews);
    };

    if (filteredData && plotRefs.current[0] && accessionFields.length > 0) {
      createVegaViews();
    }

    return () => {
      vegaViews.forEach(view => view?.finalize());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredData, accessionFields, projectAbbrev, navigate, timeFilterObject]);

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
        Accession counts
      </Typography>
      {errorMessage ? (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {errorMessage}
        </Alert>
      ) :
        (data?.fieldLoadingStates[ORG_FIELD_NAME] === LoadingState.SUCCESS && (
          <Grid container spacing={2}>
            {accessionFields.map((field, index) => (
              <Grid key={field.columnName} container size={{ xs: 12, md: 12, lg: 6 }}>
                <Grid size={11}>
                  <div
                    ref={el => { plotRefs.current[index] = el; }}
                    style={{ width: '100%' }}
                  />
                </Grid>
                <Grid size={1}>
                  <ExportVegaPlot vegaView={vegaViews[index]} />
                </Grid>
              </Grid>
            ))}
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
