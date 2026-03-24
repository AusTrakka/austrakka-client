import { Alert, AlertTitle, Box, Typography } from '@mui/material';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { useEffect, useState } from 'react';
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
import {
  buildPrimeReactColumnDefinitionsPVF,
  type PrimeReactColumnDefinition,
} from '../../../utilities/tableUtils';

interface SummaryMetadataTableProps extends ProjectWidgetProps {
  projectAbbrev: string;
  filteredData: Sample[];
  displayFields?: string[];
  title: string;
  include?: { field: string; value: string }[];
}

export default function SummaryMetadataTable(props: SummaryMetadataTableProps) {
  const { projectAbbrev, filteredData, displayFields = [], title, include } = props;
  const [tableColumns, setTableColumns] = useState<PrimeReactColumnDefinition[]>([]);
  const [tableData, setTableData] = useState<Sample[]>();
  const data: ProjectMetadataState | null = useAppSelector((state) =>
    selectProjectMetadata(state, projectAbbrev),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Use displayFields if provided (and in project), otherwise show all fields in project view
  const fields =
    displayFields.length > 0 ? displayFields : (data?.fields?.map((f) => f.columnName) ?? []);

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

  return (
    <Box display="flex" flexDirection="column" height="100%">
      <Typography variant="h5" paddingBottom={3} color="primary">
        {title}
      </Typography>
      {fields.every((field) => data?.fieldLoadingStates[field] === LoadingState.SUCCESS) && (
        <Box flex={1} minHeight={0}>
          <DataTable
            value={tableData}
            size="small"
            selectionMode="single"
            scrollable
            scrollHeight="flex"
            emptyMessage="No data to display"
          >
            {tableColumns.map((col: PrimeReactColumnDefinition) => (
              <Column key={col.field} field={col.field} header={col.header} body={col.body} />
            ))}
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
