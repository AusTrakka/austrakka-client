/* eslint react/require-default-props: 0 */
import React, { useEffect, useRef, useState } from 'react';
import { Alert, AlertTitle, Box, Tooltip, Typography } from '@mui/material';
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
import { ownerGroupVegaTransform } from '../../../utilities/plotUtils';
import { Sample } from '../../../types/sample.interface';

// Parameterised widget; field must be specified

interface MetadataCountWidgetProps extends ProjectWidgetProps {
  projectAbbrev: string;
  filteredData: Sample[];
  timeFilterObject: DataTableFilterMeta;
  field: string; // This is the field parameter the widget will report on
  categoryField?: string; // This is the y-axis field; defaults to Owner_group
  title?: string | undefined; // Optionally, a different title for the widget
}

export default function MetadataCounts(props: MetadataCountWidgetProps) {
  const { projectAbbrev, filteredData, timeFilterObject, field, title } = props;
  let { categoryField } = props;
  let axisTitle = categoryField;
  if (!categoryField) {
    categoryField = 'Owner_group';
  }
  if (!axisTitle) {
    axisTitle = 'Organisation';
  }
  const data: ProjectMetadataState | null = useAppSelector(state =>
    selectProjectMetadata(state, projectAbbrev));
  const plotDiv = useRef<HTMLDivElement>(null);
  const [vegaView, setVegaView] = useState<VegaView | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const tooltipTitle = `Samples with populated ${field} values`;

  const CHART_COLORS = {
    AVAILABLE: import.meta.env.VITE_THEME_SECONDARY_MAIN,
    MISSING: import.meta.env.VITE_THEME_PRIMARY_GREY_300,
  } as const;
  
  const dateStatusTransform = {
    calculate: `datum['${field}'] ? 'Available' : 'Missing'`,
    as: `${field}_status`,
  };

  function handleItemClick(item: any) {
    if (!item || !item.datum) return;

    const status = item.datum[`${field}_status`];
    let category = item.datum[categoryField!];
    if (categoryField === 'Owner_group') category = `${category}-Owner`;

    const drillDownTableMetaFilters: DataTableFilterMeta = {
      [field]: {
        operator: FilterOperator.AND,
        constraints: [
          {
            matchMode: FilterMatchMode.CUSTOM,
            value: status !== 'Available',
          },
        ],
      },
      [categoryField!]: {
        operator: FilterOperator.AND,
        constraints: [
          {
            matchMode: FilterMatchMode.EQUALS,
            value: category,
          },
        ],
      },
    };

    const combinedFilters: DataTableFilterMeta =
        timeFilterObject && Object.keys(timeFilterObject).length !== 0 ?
          { ...drillDownTableMetaFilters, ...timeFilterObject }
          : drillDownTableMetaFilters;

    updateTabUrlWithSearch(navigate, '/samples', combinedFilters);
  }


  
  const createSpec = () => ({
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { name: 'inputdata' },
    transform: [
      ...ownerGroupVegaTransform(categoryField),
      dateStatusTransform,
    ],
    width: 'container',
    height: { step: 40 },
    layer: [{
      mark: { type: 'bar', tooltip: true, cursor: 'pointer' },
      encoding: {
        x: {
          aggregate: 'count',
          stack: 'zero',
          axis: { title: 'Count' },
        },
        y: {
          field: categoryField,
          axis: { title: axisTitle },
        },
        color: {
          field: `${field}_status`,
          scale: {
            domain: ['Available', 'Missing'],
            range: [CHART_COLORS.AVAILABLE, CHART_COLORS.MISSING],
          },
          legend: { title: `${field} status`, orient: 'bottom' },
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
        y: { field: categoryField },
        detail: {
          field: `${field}_status`,
        },
      },
    }],
    title: {
      text: `${field} counts`,
      anchor: 'middle',
      fontSize: 12,
    },
    usermeta: {
      dateCollField: field,
    },
  });

  useEffect(() => {
    if (data?.loadingState === MetadataLoadingState.ERROR) {
      setErrorMessage(data.errorMessage);
      return;
    }
    if (data?.fieldLoadingStates[categoryField!] === LoadingState.ERROR) {
      setErrorMessage(`Error loading ${categoryField} values`);
      return;
    }
    if (data?.fieldLoadingStates[field] === LoadingState.ERROR) {
      setErrorMessage(`Error loading ${field} values`);
      return;
    }
    if (categoryField && data?.loadingState && (
      data.loadingState === MetadataLoadingState.FIELDS_LOADED ||
      data.loadingState === MetadataLoadingState.DATA_LOADED
    )) {
      const fields = data.fields!.map(_field => _field.columnName);
      if (!fields.includes(categoryField!)) {
        setErrorMessage(`Field ${categoryField} not found in project`);
      } else if (!fields.includes(field)) {
        setErrorMessage(`Field ${field} not found in project`);
      }
    }
  }, [data, field, categoryField]);

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
        .addEventListener('click', (_, item) => handleItemClick(item))
        .runAsync();
      setVegaView(view);
    };

    if (filteredData && plotDiv?.current) {
      createVegaViews();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredData, plotDiv, projectAbbrev, navigate, timeFilterObject]);

  return (
    <Box>
      <Tooltip title={tooltipTitle} arrow placement="top">
        <Typography variant="h5" paddingBottom={3} color="primary">
          { title ?? `${field} counts` }
        </Typography>
      </Tooltip>
      {errorMessage ? (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {errorMessage}
        </Alert>
      ) :
        (data?.fieldLoadingStates[categoryField] === LoadingState.SUCCESS && (
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
