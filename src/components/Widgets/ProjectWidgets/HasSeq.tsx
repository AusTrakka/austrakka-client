/* eslint react/require-default-props: 0 */
import React, { useEffect, useRef, useState } from 'react';
import { Alert, AlertTitle, Box, Typography } from '@mui/material';
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
import { Sample } from '../../../types/sample.interface';
import { ownerGroupVegaTransform } from '../../../utilities/plotUtils';
import { genericErrorMessage } from '../../../utilities/api';
import { useStableNavigate } from '../../../app/NavigationContext';

// Takes y-axis field as an optional parameter; 
// defaults to Owner_group, which gets special handling

const HAS_SEQ = 'Has_sequences';

const CHART_COLORS = {
  AVAILABLE: import.meta.env.VITE_THEME_SECONDARY_MAIN,
  MISSING: import.meta.env.VITE_THEME_PRIMARY_GREY_300,
} as const;

interface HasSeqWidgetProps extends ProjectWidgetProps {
  projectAbbrev: string;
  filteredData?: Sample[];
  timeFilterObject?: DataTableFilterMeta;
  categoryField?: string;
}

function HasSeq(props: HasSeqWidgetProps) {
  const { projectAbbrev, filteredData, timeFilterObject } = props;
  let { categoryField } = props;
  let axisTitle = categoryField;
  if (!categoryField) {
    categoryField = 'Owner_group';
  }
  if (!axisTitle) {
    axisTitle = 'Organisation';
  }
  const { navigate } = useStableNavigate();
  const data: ProjectMetadataState | null = useAppSelector(state =>
    selectProjectMetadata(state, projectAbbrev));
  const plotDiv = useRef<HTMLDivElement>(null);
  const [vegaView, setVegaView] = useState<VegaView | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const dateStatusTransform = {
    calculate: `datum['${HAS_SEQ}'] === 'True' ? 'Available' : 'Missing'`,
    as: `${HAS_SEQ}_status`,
  };
  
  function handleItemClick(item: any) {
    if (!navigate) { setErrorMessage(genericErrorMessage); return; }
    if (!item || !item.datum) return;
    
    const status = item.datum[`${HAS_SEQ}_status`];
    let category = item.datum[categoryField!];
    if (categoryField === 'Owner_group') category = `${category}-Owner`;
    
    const drillDownTableMetaFilters: DataTableFilterMeta = {
      [HAS_SEQ]: {
        operator: FilterOperator.AND,
        constraints: [
          {
            matchMode: FilterMatchMode.EQUALS,
            value: status === 'Available',
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
          field: `${HAS_SEQ}_status`,
          scale: {
            domain: ['Available', 'Missing'],
            range: [CHART_COLORS.AVAILABLE, CHART_COLORS.MISSING],
          },
          legend: { title: 'Has sequence status', orient: 'bottom' },
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
          field: `${HAS_SEQ}_status`,
        },
      },
    }],
    title: {
      text: `${HAS_SEQ} counts`,
      anchor: 'middle',
      fontSize: 12,
    },
    usermeta: {
      hasSeqField: HAS_SEQ,
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
    if (data?.fieldLoadingStates[HAS_SEQ] === LoadingState.ERROR) {
      setErrorMessage(`Error loading ${HAS_SEQ} values`);
      return;
    }
    if (categoryField && data?.loadingState && (
      data.loadingState === MetadataLoadingState.FIELDS_LOADED ||
            data.loadingState === MetadataLoadingState.DATA_LOADED
    )) {
      const fields = data.fields!.map(field => field.columnName);
      if (!fields.includes(categoryField!)) {
        setErrorMessage(`Field ${categoryField} not found in project`);
      } else if (!fields.includes(HAS_SEQ)) {
        setErrorMessage(`Field ${HAS_SEQ} not found in project`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.loadingState, data?.fieldLoadingStates, categoryField]);
  
  useEffect(() => {
    const createVegaViews = async () => {
      // Cleanup existing views
      if (vegaView) {
        vegaView.finalize();
      }

      const spec = createSpec();
      const compiledSpec = compile(spec as TopLevelSpec).spec;
      (compiledSpec.data![0] as InlineData).values =
          filteredData!.map((item: any) => ({ ...item }));

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
      <Typography variant="h5" paddingBottom={3} color="primary">
        Sequence counts
      </Typography>
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
export default HasSeq;
