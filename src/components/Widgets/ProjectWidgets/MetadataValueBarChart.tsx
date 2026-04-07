import { Alert, AlertTitle, Box, Tooltip, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import type { DataTableFilterMeta } from 'primereact/datatable';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parse, View as VegaView } from 'vega';
import { compile, type TopLevelSpec } from 'vega-lite';
import type { InlineData } from 'vega-lite/types_unstable/data.js';
import {
  type ProjectMetadataState,
  selectProjectMetadata,
} from '../../../app/projectMetadataSlice';
import { useAppSelector } from '../../../app/store';
import MetadataLoadingState from '../../../constants/metadataLoadingState';
import type ProjectWidgetProps from '../../../types/projectwidget.props';
import type { Sample } from '../../../types/sample.interface';
import { NULL_COLOUR } from '../../../utilities/colourUtils';
import {
  filterExcluded,
  isNullOrEmpty,
  pruneColumns,
  topCategories,
} from '../../../utilities/dataProcessingUtils';
import { updateTabUrlWithSearch } from '../../../utilities/navigationUtils';
import { createVegaScale } from '../../../utilities/plotUtils';
import ExportVegaPlot from '../../Plots/ExportVegaPlot';

// Parameterised widget; field must be specified
const DEFAULT_COLOUR_SCHEME = 'tableau10';

interface MetadataValueWidgetProps extends ProjectWidgetProps {
  projectAbbrev: string;
  filteredData: Sample[];
  timeFilterObject?: DataTableFilterMeta;
  field: string; // This is the field parameter the widget will report on
  title?: string | undefined; // Optionally, a different title for the widget
  colourScheme?: string | undefined;
  colourMapping?: Record<string, string> | undefined;
  legendColumns?: number | undefined;
  categoryLimit?: number | undefined; // Optional limit for number of categories to show
  exclude?: { field: string; value: string }[] | undefined; // Optional field/value pairs to exclude
  vertical?: boolean | undefined; // Whether to display bar vertically or horizontally
}

export default function MetadataValueBarChart(props: MetadataValueWidgetProps) {
  const {
    projectAbbrev,
    filteredData,
    timeFilterObject,
    field,
    title,
    colourScheme,
    colourMapping,
    legendColumns = 4,
    categoryLimit,
    vertical = false,
    exclude,
  } = props;
  if (colourScheme && colourMapping) {
    // biome-ignore lint/suspicious/noConsole: historic
    console.warn(
      'colourScheme and colourMapping are mutually exclusive; colourScheme will be ignored',
    );
  }
  // TODO maybe just fieldUniqueValues selector?
  const data: ProjectMetadataState | null = useAppSelector((state) =>
    selectProjectMetadata(state, projectAbbrev),
  );
  const plotDiv = useRef<HTMLDivElement>(null);
  const [vegaView, setVegaView] = useState<VegaView | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const tooltipTitle = `${field} values`;

  function handleItemClick(item: any) {
    if (!item || !item.datum) return;

    const value = item.datum[field];
    let drillDownTableMetaFilters: DataTableFilterMeta = {};

    if (isNullOrEmpty(value)) {
      // Find empty values
      drillDownTableMetaFilters = {
        [field]: {
          operator: FilterOperator.AND,
          constraints: [
            {
              matchMode: FilterMatchMode.CUSTOM,
              value: true,
            },
          ],
        },
      };
    } else {
      // Not null, so match metadata value
      drillDownTableMetaFilters = {
        [field]: {
          operator: FilterOperator.AND,
          constraints: [
            {
              matchMode: FilterMatchMode.EQUALS,
              value,
            },
          ],
        },
      };
    }

    const combinedFilters: DataTableFilterMeta =
      timeFilterObject && Object.keys(timeFilterObject).length !== 0
        ? { ...drillDownTableMetaFilters, ...timeFilterObject }
        : drillDownTableMetaFilters;

    updateTabUrlWithSearch(navigate, '/samples', combinedFilters);
  }

  // Not ideal, but only used for the case where the widget colourMapping is specified incorrectly
  const randomColour = () => {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 70;
    const lightness = 70;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // Move to utility file if used outside this widget
  const createCustomScale = () => {
    let uniqueValues = data!.fieldUniqueValues![field] ?? [];
    let widgetData = filteredData;

    if (exclude && exclude.length > 0) {
      const excluded = filterExcluded(filteredData, exclude);
      widgetData = excluded;
    }

    if (categoryLimit) {
      const categories = topCategories(widgetData, field, categoryLimit);
      uniqueValues = uniqueValues.filter((val) => categories.includes(val));
    }

    if (colourMapping) {
      return {
        domain: uniqueValues,
        range: uniqueValues.map((val) =>
          isNullOrEmpty(val) ? NULL_COLOUR : (colourMapping[val] ?? randomColour()),
        ),
      };
    }
    return createVegaScale(uniqueValues, colourScheme || DEFAULT_COLOUR_SCHEME);
  };

  const createSpec = () => ({
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: { name: 'inputdata' },
    ...(vertical ? { width: '30' } : { height: 30, width: 'container' }),
    layer: [
      {
        mark: {
          type: 'bar',
          tooltip: true,
          cursor: 'pointer',
          ...(vertical ? { width: 30 } : { height: 30 }),
        },
        encoding: {
          y: vertical
            ? { aggregate: 'count', type: 'quantitative', axis: { title: 'Count' } }
            : { value: 'all' },
          x: vertical
            ? { value: 'all' }
            : { aggregate: 'count', type: 'quantitative', axis: { title: 'Count' } },
          color: {
            field,
            scale: createCustomScale(),
            legend: {
              title: field,
              orient: 'bottom',
              columns: legendColumns,
              labelExpr: "datum.label || 'unknown'",
            },
          },
          order: { aggregate: 'count', sort: 'descending' },
        },
      },
    ],
    usermeta: {
      dateCollField: field,
    },
  });

  const truncateData = (data: any[]) => {
    if (exclude && exclude.length > 0) {
      data = filterExcluded(data, exclude);
    }
    const categories = topCategories(data, field, categoryLimit);
    // Filter data to only include items in the top categories
    return data.filter((item) => {
      if (categoryLimit && isNullOrEmpty(item[field])) return false;
      const value = item[field];
      return categories.includes(value);
    });
  };

  useEffect(() => {
    if (
      data?.loadingState &&
      (data.loadingState === MetadataLoadingState.FIELDS_LOADED ||
        data.loadingState === MetadataLoadingState.DATA_LOADED)
    ) {
      const fields = data.fields!.map((fld) => fld.columnName);
      if (!fields.includes(field)) {
        setInfoMessage(
          `Field ${field} not found in project. Add this field to the project to see data.`,
        );
      }
    }
  }, [data, field]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: historic
  useEffect(() => {
    const createVegaViews = async () => {
      // Cleanup existing views
      if (vegaView) {
        vegaView.finalize();
      }

      const spec = createSpec();
      const compiledSpec = compile(spec as TopLevelSpec).spec;
      let plotData = [];

      if (categoryLimit || (exclude && exclude.length > 0)) {
        plotData = truncateData(filteredData);
      }

      const pruned = pruneColumns(plotData, [field]);
      const copy = pruned.map((item: any) => ({ ...item }));
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
  }, [filteredData, plotDiv, projectAbbrev, navigate, timeFilterObject]);

  useEffect(() => {
    if (data?.loadingState === MetadataLoadingState.ERROR) {
      setErrorMessage(data.errorMessage);
    }
  }, [data]);

  return (
    <Box>
      <Tooltip title={tooltipTitle} arrow placement="top">
        <Typography variant="h5" paddingBottom={3} color="primary">
          {title ?? `${field} counts`}
        </Typography>
      </Tooltip>
      {errorMessage && (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {errorMessage}
        </Alert>
      )}
      {infoMessage && <Alert severity="info">{infoMessage}</Alert>}
      {!errorMessage &&
        !infoMessage &&
        (vertical ? (
          <Grid container>
            <Grid sx={{ minHeight: 0 }}>
              <div id="plot-container" ref={plotDiv} />
            </Grid>
            <Grid>
              <ExportVegaPlot vegaView={vegaView} />
            </Grid>
          </Grid>
        ) : (
          <Grid container>
            <Grid size={11}>
              <div id="#plot-container" ref={plotDiv} style={{ width: '100%' }} />
            </Grid>
            <Grid size={1}>
              <ExportVegaPlot vegaView={vegaView} />
            </Grid>
          </Grid>
        ))}
      {(!data?.loadingState ||
        !(
          data.loadingState === MetadataLoadingState.DATA_LOADED ||
          data.loadingState === MetadataLoadingState.ERROR ||
          data.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR
        )) && <div>Loading...</div>}
    </Box>
  );
}
