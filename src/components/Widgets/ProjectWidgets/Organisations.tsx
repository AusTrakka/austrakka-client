import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { Column } from 'primereact/column';
import {
  DataTable,
  type DataTableFilterMeta,
  type DataTableRowClickEvent,
  type DataTableValue,
} from 'primereact/datatable';
import { useEffect, useState } from 'react';
import { useStableNavigate } from '../../../app/NavigationContext';
import {
  type ProjectMetadataState,
  selectProjectMetadata,
} from '../../../app/projectMetadataSlice';
import { useAppSelector } from '../../../app/store';
import LoadingState from '../../../constants/loadingState';
import MetadataLoadingState from '../../../constants/metadataLoadingState';
import type ProjectWidgetProps from '../../../types/projectwidget.props';
import { aggregateArrayObjects, type CountRow } from '../../../utilities/dataProcessingUtils';
import { updateTabUrlWithSearch } from '../../../utilities/navigationUtils';

// TODO This widget is really now obsolete; we could use the Counts widget
const ORG_FIELD_NAME = 'Owner_group';

const columns = [
  {
    field: 'value',
    header: 'Owner organisation',
    body: (rowData: any) => rowData.value.split('-Owner'),
  },
  {
    field: 'count',
    header: 'Sample Count',
  },
];

export default function Organisations(props: ProjectWidgetProps) {
  const { projectAbbrev, filteredData, timeFilterObject } = props;
  const { navigate } = useStableNavigate();
  const data: ProjectMetadataState | null = useAppSelector((state) =>
    selectProjectMetadata(state, projectAbbrev),
  );
  const [aggregatedCounts, setAggregatedCounts] = useState<CountRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (
      data?.loadingState === MetadataLoadingState.DATA_LOADED ||
      (data?.loadingState === MetadataLoadingState.PARTIAL_DATA_LOADED &&
        data.fieldLoadingStates[ORG_FIELD_NAME] === LoadingState.SUCCESS)
    ) {
      const counts = aggregateArrayObjects(ORG_FIELD_NAME, filteredData!) as CountRow[];
      counts.sort((a, b) => b.count - a.count);
      setAggregatedCounts(counts);
    }
  }, [filteredData, data?.loadingState, data?.fieldLoadingStates]);

  useEffect(() => {
    if (data?.fields && !data.fields.map((fld) => fld.columnName).includes(ORG_FIELD_NAME)) {
      setErrorMessage(`Field ${ORG_FIELD_NAME} not found in project`);
    } else if (data?.loadingState === MetadataLoadingState.ERROR) {
      setErrorMessage(data.errorMessage);
    } else if (data?.fieldLoadingStates[ORG_FIELD_NAME] === LoadingState.ERROR) {
      setErrorMessage(`Error loading ${ORG_FIELD_NAME} values`);
    }
  }, [data]);

  const rowClickHandler = (row: DataTableRowClickEvent) => {
    const selectedRow: DataTableValue = row.data;
    const drillDownTableMetaFilters: DataTableFilterMeta = {
      [ORG_FIELD_NAME]: {
        operator: FilterOperator.AND,
        constraints: [
          {
            matchMode: FilterMatchMode.EQUALS,
            value: selectedRow.value,
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
  };

  return (
    <Box>
      <Typography variant="h5" paddingBottom={3} color="primary">
        Owner organisations
      </Typography>
      {data?.fieldLoadingStates[ORG_FIELD_NAME] === LoadingState.SUCCESS && (
        <DataTable
          value={aggregatedCounts}
          size="small"
          onRowClick={rowClickHandler}
          selectionMode="single"
        >
          {columns.map((col: any) => (
            <Column key={col.field} field={col.field} header={col.header} body={col.body} />
          ))}
        </DataTable>
      )}
      {errorMessage && (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {errorMessage}
        </Alert>
      )}
      {(!data?.fieldLoadingStates ||
        data?.fieldLoadingStates[ORG_FIELD_NAME] === LoadingState.LOADING ||
        data?.fieldLoadingStates[ORG_FIELD_NAME] === LoadingState.IDLE) && <div>Loading...</div>}
    </Box>
  );
}
