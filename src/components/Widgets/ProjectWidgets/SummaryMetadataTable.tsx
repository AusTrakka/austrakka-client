import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Alert, AlertTitle, Box, Button, Link, Typography } from '@mui/material';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { Column } from 'primereact/column';
import {
  DataTable,
  type DataTableFilterMeta,
  type DataTableRowClickEvent,
} from 'primereact/datatable';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  type ProjectMetadataState,
  selectProjectMetadata,
} from '../../../app/projectMetadataSlice';
import { useAppSelector } from '../../../app/store';
import LoadingState from '../../../constants/loadingState';
import MetadataLoadingState from '../../../constants/metadataLoadingState';
import type ProjectWidgetProps from '../../../types/projectwidget.props';
import type { Sample } from '../../../types/sample.interface';
import { filterIncluded } from '../../../utilities/dataProcessingUtils';
import { updateTabUrlWithSearch } from '../../../utilities/navigationUtils';
import {
  buildPrimeReactColumnDefinitionsPVF,
  type PrimeReactColumnDefinition,
} from '../../../utilities/tableUtils';

interface SummaryMetadataTableProps extends ProjectWidgetProps {
  projectAbbrev: string;
  filteredData: Sample[];
  displayFields?: string[];
  title: string;
  timeFilterObject: DataTableFilterMeta;
  include?: { field: string; value: string }[];
}

const DEFAULT_COLUMN = 'Seq_ID';

export default function SummaryMetadataTable(props: SummaryMetadataTableProps) {
  const {
    projectAbbrev,
    filteredData,
    displayFields = [],
    title,
    include,
    timeFilterObject,
  } = props;
  const [tableColumns, setTableColumns] = useState<PrimeReactColumnDefinition[]>([]);
  const [tableData, setTableData] = useState<Sample[]>();
  const data: ProjectMetadataState | null = useAppSelector((state) =>
    selectProjectMetadata(state, projectAbbrev),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  // Use displayFields if provided (and in project), otherwise show default only
  const getFields = () => {
    if (displayFields.length > 0) {
      return displayFields.includes(DEFAULT_COLUMN)
        ? displayFields
        : [DEFAULT_COLUMN, ...displayFields];
    }
    return [DEFAULT_COLUMN];
  };

  const fields = getFields();

  useEffect(() => {
    if (
      data?.loadingState === MetadataLoadingState.DATA_LOADED ||
      (data?.loadingState === MetadataLoadingState.PARTIAL_DATA_LOADED &&
        fields.every((field) => data.fieldLoadingStates[field] === LoadingState.SUCCESS))
    ) {
      // Use the same approach as ProjectSamplesTable: build columns with correct renderers
      const columns = data?.fields
        ? buildPrimeReactColumnDefinitionsPVF(
            data.fields.filter((f) => fields.includes(f.columnName)),
          )
        : fields.map((field) => ({ field, header: field }));

      setTableColumns(columns);
    }
  }, [fields, data?.loadingState, data?.fieldLoadingStates, data?.fields]);

  useEffect(() => {
    if (
      data?.fields &&
      !fields.every((field) => (data.fields ?? []).map((fld) => fld.columnName).includes(field))
    ) {
      setErrorMessage(`One or more fields not found in project`);
    } else if (data?.loadingState === MetadataLoadingState.ERROR) {
      setErrorMessage(data.errorMessage);
    } else if (fields.some((field) => data?.fieldLoadingStates[field] === LoadingState.ERROR)) {
      setErrorMessage(`Error loading one or more field values`);
    }
  }, [data, fields]);

  useEffect(() => {
    const truncatedData = filterIncluded(filteredData, include);
    setTableData(truncatedData);
  }, [filteredData, include]);

  // Drilldown on click - navigate to samples page with filters for the clicked value + existing time filters
  const rowClickHandler = (row: DataTableRowClickEvent) => {
    const selectedRow = row.data;
    let drillDownTableMetaFilters: DataTableFilterMeta = {};

    drillDownTableMetaFilters = {
      [DEFAULT_COLUMN]: {
        operator: FilterOperator.AND,
        constraints: [
          {
            matchMode: FilterMatchMode.EQUALS,
            value: selectedRow[DEFAULT_COLUMN],
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

  // Click handler to view all in this table in sample table
  const viewAllClickHandler = () => {
    const drillDownTableMetaFilters: DataTableFilterMeta = {};
    // This should match inclusion criteria for this table
    if (include && include.length > 0) {
      // Multiple include filters are appended together in the table, so do the same for drilldown
      include.forEach((inc) => {
        drillDownTableMetaFilters[inc.field] = {
          operator: FilterOperator.AND,
          constraints: [
            {
              matchMode: FilterMatchMode.EQUALS,
              value: inc.value,
            },
          ],
        };
      });
    }

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
    <Box display="flex" flexDirection="column" height="100%">
      <Box display="flex" justifyContent="space-between" alignItems="center" paddingBottom={3}>
        <Typography variant="h5" color="primary">
          {title}
        </Typography>
        <Button
          onClick={viewAllClickHandler}
          disabled={
            !tableData || tableData.length === 0 || include === undefined || include.length === 0
          }
          variant="outlined"
          size="small"
          endIcon={<NavigateNextIcon />}
          sx={{ textTransform: 'none' }}
        >
          View in Samples table
        </Button>
      </Box>
      {fields.every((field) => data?.fieldLoadingStates[field] === LoadingState.SUCCESS) && (
        <Box flex={1} minHeight={0}>
          <DataTable
            value={tableData}
            size="small"
            scrollable
            scrollHeight="flex"
            emptyMessage="No data to display"
          >
            {tableColumns.map((col: PrimeReactColumnDefinition) =>
              col.field === DEFAULT_COLUMN ? (
                <Column
                  key={col.field}
                  field={col.field}
                  header={col.header}
                  body={(rowData: any) => {
                    // Custom body to add click handler for drilldown, wrapping existing body if it exists
                    const content = col.body ? col.body(rowData) : rowData[DEFAULT_COLUMN];
                    return (
                      <Link
                        component="button"
                        variant="body2"
                        underline="hover"
                        onClick={() => rowClickHandler({ data: rowData } as any)}
                      >
                        {content}
                      </Link>
                    );
                  }}
                />
              ) : (
                <Column key={col.field} field={col.field} header={col.header} body={col.body} />
              ),
            )}
          </DataTable>
        </Box>
      )}
      {errorMessage && (
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {errorMessage}
        </Alert>
      )}
      {(!data?.fieldLoadingStates ||
        fields.some((field) => data?.fieldLoadingStates[field] === LoadingState.LOADING) ||
        fields.some((field) => data?.fieldLoadingStates[field] === LoadingState.IDLE)) && (
        <div>Loading...</div>
      )}
    </Box>
  );
}
