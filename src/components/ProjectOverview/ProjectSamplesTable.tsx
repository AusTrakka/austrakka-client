/* eslint-disable react/jsx-pascal-case */
import React, {
  memo,
  useEffect,
  useState,
} from 'react';
import { Close, InfoOutlined, TextRotateUp, TextRotateVertical, Insights, Description, MergeType } from '@mui/icons-material';
import { DataTable, DataTableRowClickEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {
  IconButton, Dialog, Alert, AlertTitle, Paper, Tooltip, Typography, alpha,
} from '@mui/material';
import './Samples.css';
import { Skeleton } from 'primereact/skeleton';
import LoadingState from '../../constants/loadingState';
import { SAMPLE_ID_FIELD } from '../../constants/metadataConsts';
import DataFilters, { defaultState } from '../DataFilters/DataFilters';
import { ProjectMetadataState, selectProjectMetadata } from '../../app/projectMetadataSlice';
import { buildPrimeReactColumnDefinitionsPVF, PrimeReactColumnDefinition } from '../../utilities/tableUtils';
import MetadataLoadingState from '../../constants/metadataLoadingState';
import { Sample } from '../../types/sample.interface';
import { useAppSelector } from '../../app/store';
import ExportTableData from '../Common/ExportTableData';
import HeaderColourToggle from '../TableComponents/HeaderColourToggle';
import ColumnVisibilityMenu from '../TableComponents/ColumnVisibilityMenu';
import useMaxHeaderHeight from '../TableComponents/UseMaxHeight';
import sortIcon from '../TableComponents/SortIcon';
import KeyValuePopOver from '../TableComponents/KeyValuePopOver';
import { ProjectField } from '../../types/dtos';
import { useStateFromSearchParamsForFilterObject } from '../../utilities/stateUtils';
import { useStableNavigate } from '../../app/NavigationContext';
import { columnStyleRules, combineClasses } from '../../styles/metadataFieldStyles';
import { Theme } from '../../assets/themes/theme';

interface SamplesProps {
  projectAbbrev: string,
}

interface BodyComponentProps {
  col: Sample,
  readyFields: Record<string, LoadingState> | undefined,
}
  
function BodyComponent(props: BodyComponentProps) {
  const { col, readyFields } = props;
  return !readyFields || readyFields[col.field] !== LoadingState.SUCCESS ? (
    <Skeleton /> // Replace with your skeleton component
  ) : (
    col.body// Wrap your existing body content
  );
}

function ProjectSamplesTable(props: SamplesProps) {
  const {
    projectAbbrev,
  } = props;
  
  const { navigate } = useStableNavigate();
  const [sampleTableColumns, setSampleTableColumns] = useState<PrimeReactColumnDefinition[]>([]);
  const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);
  const [currentFilters, setCurrentFilters] = useStateFromSearchParamsForFilterObject(
    'filters',
    defaultState,
    navigate,
  );
  const [filteredData, setFilteredData] = useState<Sample[]>([]);
  const [isDataFiltersOpen, setIsDataFiltersOpen] = useState(true);

  const [loadingState, setLoadingState] = useState<boolean>(false);
  const [verticalHeaders, setVerticalHeaders] = useState<boolean>(false);
  const [allFieldsLoaded, setAllFieldsLoaded] = useState<boolean>(false);
  const [filteredDataLength, setFilteredDataLength] =
    useState<number>(0);
  const [colourBySource, setColourBySource] = useState<boolean>(true);

  const metadata: ProjectMetadataState | null =
    useAppSelector(state => selectProjectMetadata(state, projectAbbrev));
  const { maxHeight, getHeaderRef } =
    useMaxHeaderHeight(metadata?.loadingState ?? MetadataLoadingState.IDLE);
  // Set column headers from metadata state
  useEffect(() => {
    if (!metadata?.fields || !metadata?.fieldLoadingStates) return;
    const columnBuilder = buildPrimeReactColumnDefinitionsPVF(metadata.fields);
    if (Object.values(metadata.fieldLoadingStates).every(field => field === LoadingState.SUCCESS)) {
      setAllFieldsLoaded(true);
    }
    setSampleTableColumns(columnBuilder);
    setFilteredDataLength(metadata.metadata?.length ?? 0);
  }, [metadata?.fields, metadata?.fieldLoadingStates, metadata?.metadata?.length]);

  // Open error dialog if loading state changes to error
  useEffect(() => {
    if (metadata?.loadingState === MetadataLoadingState.ERROR ||
      metadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR) {
      setErrorDialogOpen(true);
    }
  }, [metadata?.loadingState]);
  
  const rowClickHandler = (event: DataTableRowClickEvent) => {
    const selectedRow = event.data as Sample;
    if (SAMPLE_ID_FIELD in selectedRow) {
      navigate(`/projects/${projectAbbrev}/records/${selectedRow[SAMPLE_ID_FIELD]}`);
    }
  };

  useEffect(() => {
    if (metadata?.loadingState === MetadataLoadingState.DATA_LOADED) {
      setFilteredData(metadata?.metadata!);
    }
  }, [metadata?.loadingState, metadata?.metadata]);

  const getFieldSource = (field: string) => {
    const fieldObj = metadata?.fields?.find(f => f.columnName === field);
    // Field Object returned from the server ideally shouldn't include "Source From" string
    return `${fieldObj?.fieldSource.replace(/^Source From\s*/i, '')}`;
  };

  const header = (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <HeaderColourToggle
          colourBySource={colourBySource}
          setColourBySource={setColourBySource}
        />
        <KeyValuePopOver
          data={metadata?.projectFields || []}
          keyExtractor={(field: ProjectField) => field.fieldName}
          valueExtractor={(field: ProjectField) => field.fieldSource}
          valueFormatter={(value: string) => value.replace(/^Source From\s*/i, '')}
          searchPlaceholder="Search by field..."
          toolTipTitle="Show Field Sources"
        />
        <ColumnVisibilityMenu
          columns={sampleTableColumns}
          onColumnVisibilityChange={(selectedCols) => {
            const newColumns = sampleTableColumns.map((col: any) => {
              const newCol = { ...col };
              newCol.hidden = selectedCols.some(
                (selectedCol: any) => selectedCol.field === col.field,
              );
              return newCol;
            });
            setSampleTableColumns(newColumns);
          }}
          emptyColumnNames={metadata?.emptyColumns ?? null}
        />
        <Tooltip title="Toggle Vertical Headers" placement="top">
          <IconButton
            onClick={() => setVerticalHeaders(!verticalHeaders)}
            aria-label="toggle vertical headers"
          >
            {verticalHeaders ? <TextRotateVertical /> : <TextRotateUp />}
          </IconButton>
        </Tooltip>
        <ExportTableData
          dataToExport={
            metadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR
              ? []
              : filteredData ?? []
          }
          headers={sampleTableColumns.filter(col => !col.hidden).map(col => col.header)}
          disabled={metadata?.loadingState !== MetadataLoadingState.DATA_LOADED}
          fileNamePrefix={projectAbbrev}
        />
      </div>
    </div>
  );

  const getColumnHeader = (column:any, index: number, vertical: boolean) => {
    const source = getFieldSource(column.field).toLowerCase();
    const iconColour = Theme.PrimaryGrey500;
    
    const icon = (() => {
      switch (source?.toLowerCase()) {
        case 'sample record':
          return <Description fontSize="inherit" sx={{ color: iconColour }} />;

        case 'dataset':
          return <Insights fontSize="inherit" sx={{ color: iconColour }} />;

        case 'both':
          return <MergeType fontSize="inherit" sx={{ color: iconColour }} />;

        default:
          return <InfoOutlined fontSize="inherit" sx={{ color: iconColour }} />;
      }
    })();

    return !vertical ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {column.header}
        <Tooltip title={`Source from ${source}`} placement="top" arrow>
          {icon}
        </Tooltip>
      </div>
    ) : (
      <div
        ref={(ref) => getHeaderRef(ref, index)}
        className="custom-vertical-header"
      >
        <span className="vertical-text">{column.header}</span>
        <Tooltip title={`Source from ${source}`} placement="top" arrow>
          {icon}
        </Tooltip>
      </div>
    );
  };

  const getColumnHeaderStyle = (vertical: boolean, column: any) => {
    const source = getFieldSource(column.field);
    let headerColour: string | undefined;
    if (colourBySource) {
      if (source.includes('Dataset')) {
        headerColour = alpha(Theme.SecondaryTeal, 0.3);
      } else if (source.includes('Both')) {
        headerColour = alpha(Theme.SecondaryMain, 0.3);
      }
    }
    
    const headerStyle = vertical
      ? { maxHeight: `${maxHeight}px`, width: `${maxHeight}px`, backgroundColor: headerColour }
      : { width: `${maxHeight}px`, backgroundColor: headerColour };

    return headerStyle;
  };

  return (
    <div className="datatable-container-proj">
      <Dialog open={errorDialogOpen} onClose={() => setErrorDialogOpen(false)}>
        <Alert severity="error" sx={{ padding: 3 }}>
          <IconButton
            aria-label="close"
            onClick={() => setErrorDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
          <AlertTitle sx={{ paddingBottom: 1 }}>
            <strong>
              {metadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR ?
                'Project metadata could not be fully loaded' :
                'Project metadata could not be loaded'}
            </strong>
          </AlertTitle>
          {metadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR ?
            `An error occurred loading project metadata. Some fields will be null, and 
          CSV export will not be available. Refresh to reload.` :
            'An error occurred loading project metadata. Refresh to reload.'}
          <br />
          Please contact the
          {' '}
          {import.meta.env.VITE_BRANDING_NAME}
          {' '}
          team if this error persists.
        </Alert>
      </Dialog>
      <DataFilters
        dataLength={metadata?.metadata?.length ?? 0}
        filteredDataLength={filteredDataLength}
        visibleFields={sampleTableColumns}
        allFields={metadata?.fields ?? []} // want to pass in field loading states?
        fieldUniqueValues={metadata?.fieldUniqueValues ?? null}
        setPrimeReactFilters={setCurrentFilters}
        isOpen={isDataFiltersOpen}
        setIsOpen={setIsDataFiltersOpen}
        dataLoaded={allFieldsLoaded}
        setLoadingState={setLoadingState} // TODO: This is a hack to get the filters to update
        primeReactFilters={currentFilters}
      />
      {
        /* TODO: Make a function for the table so that a different sort is used per column type */
      }
      <Paper elevation={2} sx={{ marginBottom: 1, flex: 1, minHeight: 0 }}>
        <DataTable
          value={metadata?.metadata ?? []}
          onValueChange={(e) => {
            setFilteredDataLength(e.length);
            setLoadingState(false);
            setFilteredData(e);
          }}
          size="small"
          removableSort
          showGridlines
          scrollable
          scrollHeight="flex"
          paginator
          loading={loadingState}
          rows={25}
          columnResizeMode="expand"
          rowsPerPageOptions={[25, 50, 100, 500, 2000]}
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink JumpToPageDropDown"
          currentPageReportTemplate=" Viewing: {first} to {last} of {totalRecords}"
          paginatorPosition="bottom"
          paginatorRight
          header={header}
          onRowClick={rowClickHandler}
          selectionMode="single"
          className={verticalHeaders ? 'vertical-table-mode' : 'my-flexible-table'}
          filters={allFieldsLoaded ?
            currentFilters :
            defaultState}
          reorderableColumns
          resizableColumns
          sortIcon={sortIcon}
          emptyMessage={(
            <Typography variant="subtitle1" color="textSecondary" align="center">
              No samples found
            </Typography>
            )}
        >
          {metadata?.metadata ? sampleTableColumns.map((col: any, index: any) => (
            <Column
              key={col.field}
              field={col.field}
              header={getColumnHeader(col, index, verticalHeaders)}
              body={BodyComponent({ col, readyFields: metadata?.fieldLoadingStates })}
              hidden={col.hidden}
              sortable
              resizeable
              headerStyle={getColumnHeaderStyle(verticalHeaders, col)}
              headerClassName="custom-title"
              className="flexible-column"
              bodyClassName={combineClasses('value-cells', columnStyleRules[col.field])}
            />
          )) : null}
        </DataTable>
      </Paper>
    </div>
  );
}
export default memo(ProjectSamplesTable);
