/* eslint react/require-default-props: 0 */
import React, { memo, useEffect, useRef, useState } from 'react';
import { Alert, AlertTitle, Box, Tooltip, Typography } from '@mui/material';
import { compile, TopLevelSpec } from 'vega-lite';
import { parse, View as VegaView } from 'vega';
import Grid from '@mui/material/Grid2';
import { DataTableFilterMeta } from 'primereact/datatable';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { InlineData } from 'vega-lite/build/src/data';
import { shallowEqual } from 'react-redux';
import { useAppSelector } from '../../../app/store';
import { ProjectMetadataState, selectProjectMetadata } from '../../../app/projectMetadataSlice';
import MetadataLoadingState from '../../../constants/metadataLoadingState';
import LoadingState from '../../../constants/loadingState';
import ProjectWidgetProps from '../../../types/projectwidget.props';
import ExportVegaPlot from '../../Plots/ExportVegaPlot';
import { updateTabUrlWithSearch } from '../../../utilities/navigationUtils';
import { ownerGroupVegaTransform } from '../../../utilities/plotUtils';
import { Sample } from '../../../types/sample.interface';
import { useStableNavigate } from '../../../app/NavigationContext';

// Parameterised widget; field must be specified

interface MetadataCountWidgetProps extends ProjectWidgetProps {
  projectAbbrev: string;
  filteredData: Sample[];
  timeFilterObject: DataTableFilterMeta;
  field: string; // This is the field parameter the widget will report on
  categoryField?: string; // This is the y-axis field; defaults to Owner_group
  title?: string | undefined; // Optionally, a different title for the widget
}

const CHART_COLORS = {
  AVAILABLE: import.meta.env.VITE_THEME_SECONDARY_MAIN,
  MISSING: import.meta.env.VITE_THEME_PRIMARY_GREY_300,
} as const;

function MetadataCounts(props: MetadataCountWidgetProps) {
  const { projectAbbrev,
    filteredData,
    timeFilterObject,
    field,
    title,
    categoryField } = props;
  
  const { navigate } = useStableNavigate();
  const categoryFieldStable = categoryField ?? 'Owner_group';
  const axisTitleStable = categoryField ?? 'Organisation';
  
  const data: ProjectMetadataState | null = useAppSelector(state =>
    selectProjectMetadata(state, projectAbbrev), shallowEqual);
 
  const plotDiv = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const tooltipTitle = `Samples with populated ${field} values`;
  const [vegaView, setVegaView] = useState<VegaView | null>(null);
  
  const dateStatusTransform = React.useMemo(() => ({
    calculate: `datum['${field}'] ? 'Available' : 'Missing'`,
    as: `${field}_status`,
  }), [field]);

  function handleItemClick(item: any) {
    if (!item || !item.datum) return;

    const status = item.datum[`${field}_status`];
    let category = item.datum[categoryFieldStable];
    if (categoryFieldStable === 'Owner_group') category = `${category}-Owner`;

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
      [categoryFieldStable]: {
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
  
  const creatSpec = () => ({
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { name: 'inputdata' },
    transform: [
      ...ownerGroupVegaTransform(categoryFieldStable),
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
          field: categoryFieldStable,
          axis: { title: axisTitleStable },
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
        y: { field: categoryFieldStable },
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
    if (data?.fieldLoadingStates[categoryFieldStable] === LoadingState.ERROR) {
      setErrorMessage(`Error loading ${categoryFieldStable} values`);
      return;
    }
    if (data?.fieldLoadingStates[field] === LoadingState.ERROR) {
      setErrorMessage(`Error loading ${field} values`);
      return;
    }
    if (categoryFieldStable && data?.loadingState && (
      data.loadingState === MetadataLoadingState.FIELDS_LOADED ||
      data.loadingState === MetadataLoadingState.DATA_LOADED
    )) {
      const fields = data.fields!.map(_field => _field.columnName);
      if (!fields.includes(categoryFieldStable)) {
        setErrorMessage(`Field ${categoryFieldStable} not found in project`);
      } else if (!fields.includes(field)) {
        setErrorMessage(`Field ${field} not found in project`);
      }
    }
  }, [data, field, categoryFieldStable]);

  useEffect(() => {
    const createVegaViews = async () => {
      // Cleanup existing views
      if (vegaView) {
        vegaView.finalize();
      }
      const spec = creatSpec();
      const compiledSpec = compile(spec as TopLevelSpec).spec;
      const copy = filteredData!.map((item: any) => ({ ...item }));
      (compiledSpec.data![0] as InlineData).values = copy;
      
      const view = await new VegaView(parse(compiledSpec))
        .initialize(plotDiv.current!)
        .addEventListener('click', (_, item) => handleItemClick(item))
        .runAsync();
    
      setVegaView(view);
    };

    if (filteredData) {
      createVegaViews();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredData, plotDiv, projectAbbrev, timeFilterObject]);

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
        (data?.fieldLoadingStates[categoryFieldStable] === LoadingState.SUCCESS && (
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

export default memo(MetadataCounts);
