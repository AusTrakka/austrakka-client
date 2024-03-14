/* eslint-disable react/jsx-pascal-case */
import 'primereact/resources/themes/saga-green/theme.css';
import React, {
  NamedExoticComponent,
  memo,
  useEffect, useState,
} from 'react';
import { Close, Visibility } from '@mui/icons-material';
import { DataTable, DataTableRowClickEvent, DataTableFilterMeta } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {
  IconButton,
  Dialog,
  Alert, AlertTitle, Paper, MenuItem, Menu, Checkbox, ListItemText, Button, Stack, Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from 'primereact/skeleton';
import LoadingState from '../../constants/loadingState';
import { SAMPLE_ID_FIELD } from '../../constants/metadataConsts';
import DataFilters, { DataFilter } from '../DataFilters/DataFilters';
import { ProjectMetadataState, selectProjectMetadata } from '../../app/projectMetadataSlice';
import { buildPrimeReactColumnDefinitions } from '../../utilities/tableUtils';
import MetadataLoadingState from '../../constants/metadataLoadingState';
import { Sample } from '../../types/sample.interface';
import { useAppSelector } from '../../app/store';
import ExportTableData from '../Common/ExportTableData';

interface SamplesProps {
  projectAbbrev: string,
  isSamplesLoading: boolean,
  inputFilters: DataFilter[] | null,
}

interface BodyComponentProps {
  col: Sample,
  readyFields: Record<string, LoadingState>,
}

function BodyComponent(props: BodyComponentProps) {
  const { col, readyFields } = props;
  return readyFields[col.field] !== LoadingState.SUCCESS ? (
    <Skeleton /> // Replace with your skeleton component
  ) : (
    col.body// Wrap your existing body content
  );
}

interface ExportTableDataProps {
  dataToExport: any[];
  disabled: boolean;
}

const shouldComponentUpdate = (
  prevProps: Readonly<ExportTableDataProps>,
  nextProps: Readonly<ExportTableDataProps>,
): boolean => {
  // Perform your custom equality check logic here
  const dataToExportEqual = prevProps.dataToExport === nextProps.dataToExport;
  const disabledEqual = prevProps.disabled === nextProps.disabled;
  return dataToExportEqual && disabledEqual;
};

const MemoizedExportTableData: NamedExoticComponent<ExportTableDataProps> = memo(
  ExportTableData,
  shouldComponentUpdate,
);

function Samples(props: SamplesProps) {
  const {
    projectAbbrev,
    isSamplesLoading,
    inputFilters,
  } = props;
  const navigate = useNavigate();
  const [sampleTableColumns, setSampleTableColumns] = useState<any>([]);
  const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);
  const [currentFilters, setCurrentFilters] = useState<DataTableFilterMeta>({});
  const [filteredData, setFilteredData] = useState<Sample[]>([]);
  const [isDataFiltersOpen, setIsDataFiltersOpen] = useState(true);
  const [filterList, setFilterList] = useState<DataFilter[]>(inputFilters ?? []);
  const [readyFields, setReadyFields] = useState<Record<string, LoadingState>>({});
  const [loadingState, setLoadingState] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedColumns, setSelectedColumns] = useState<any>([]);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const [filteredDataLength, setFilteredDataLength] =
    useState<number>(0);

  const metadata : ProjectMetadataState | null =
    useAppSelector(state => selectProjectMetadata(state, projectAbbrev));

  // Set column headers from metadata state
  useEffect(() => {
    if (!metadata?.fields) return;
    const columnBuilder = buildPrimeReactColumnDefinitions(metadata!.fields!);
    setReadyFields(metadata!.fieldLoadingStates);
    setFilteredDataLength(metadata!.metadata?.length ?? 0);
    setSampleTableColumns(columnBuilder);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metadata?.fields, metadata?.fieldLoadingStates]);

  useEffect(() => {
    if (metadata?.loadingState === MetadataLoadingState.DATA_LOADED) {
      setFilteredData(metadata?.metadata!);
    }
  }, [metadata?.loadingState, metadata?.metadata]);

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

  const handleColumnSelect = (column: any) => {
    setSelectedColumns((prevSelectedColumns: any) =>
      (prevSelectedColumns.some((p: any) => p.header === column.header)
        ? prevSelectedColumns.filter((c : any) => c.header !== column.header)
        : [...prevSelectedColumns, column]));
  };

  const onColumnToggle = () => {
    const newColumns = sampleTableColumns.map((col: any) => {
      const newCol = { ...col };
      if (selectedColumns.length === 0) {
        newCol.hidden = false;
      } else {
        newCol.hidden = selectedColumns.some((selectedCol: any) => selectedCol.field === col.field);
      }
      return newCol;
    });
    setSampleTableColumns(newColumns);
  };

  const onColumnReset = () => {
    setSelectedColumns([]);
    const newColumns = sampleTableColumns.map((col: any) => {
      const newCol = { ...col };
      newCol.hidden = false;
      return newCol;
    });
    setSampleTableColumns(newColumns);
  };

  const header = (
    <div>
      <div style={{ display: 'flex', alignItems: 's', justifyContent: 'flex-end' }}>
        <div>
          <Tooltip title="Show/Hide Columns" placement="top" arrow>
            <IconButton
              aria-label="more"
              id="long-button"
              aria-controls={open ? 'long-menu' : undefined}
              aria-expanded={open ? 'true' : undefined}
              aria-haspopup="true"
              onClick={handleClick}
            >
              <Visibility />
            </IconButton>
          </Tooltip>
          <Menu
            id="long-menu"
            anchorEl={anchorEl}
            keepMounted
            elevation={1}
            open={open}
            anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
            sx={{ height: '50vh' }}
            onClose={handleClose}
            MenuListProps={{
              style: {
                padding: 0,
                minWidth: '230px',
              },
            }}
          >
            <Paper
              square
              sx={{ position: 'sticky',
                backgroundColor: 'white',
                top: 0,
                padding: '5px',
                zIndex: 2,
                display: 'flex',
                justifyContent: 'space-evenly' }}
            >
              <MenuItem disableGutters disableRipple dense sx={{ 'pointerEvents': 'none', '&:hover': { backgroundColor: 'white' } }}>
                <Stack direction="row" spacing={2}>
                  <div>
                    <Button
                      variant="contained"
                      onClick={(e) => {
                        e.stopPropagation();
                        onColumnToggle();
                      }}
                      sx={{ pointerEvents: 'auto' }}
                    >
                      Submit
                    </Button>
                  </div>
                  <div>
                    <Button
                      variant="outlined"
                      color="error"
                      sx={{ pointerEvents: 'auto' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onColumnReset();
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </Stack>
              </MenuItem>
            </Paper>
            {sampleTableColumns.map((column: any) => (
              <MenuItem
                key={column.header}
                value={column.field}
                onClick={() => handleColumnSelect(column)}
              >
                <Checkbox checked={selectedColumns.some((p: any) => p.header === column.header)} />
                <ListItemText primary={column.header} />
              </MenuItem>
            ))}
          </Menu>
        </div>
        <MemoizedExportTableData
          dataToExport={
          metadata?.loadingState === MetadataLoadingState.PARTIAL_LOAD_ERROR ?
            [] : filteredData ?? []
        }
          disabled={metadata?.loadingState !== MetadataLoadingState.DATA_LOADED}
        />
      </div>
    </div>
  );

  if (isSamplesLoading) return null;

  return (
    <>
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
            `An error occured loading project metadata. Some fields will be null, and 
          CSV export will not be available. Refresh to reload.` :
            'An error occured loading project metadata. Refresh to reload.'}
          <br />
          Please contact an AusTrakka admin if this error persists.
        </Alert>
      </Dialog>
      <DataFilters
        dataLength={metadata?.metadata?.length ?? 0}
        filteredDataLength={filteredDataLength}
        visibleFields={sampleTableColumns}
        allFields={metadata?.fields ?? []} // want to pass in field loading states?
        setPrimeReactFilters={setCurrentFilters}
        isOpen={isDataFiltersOpen}
        setIsOpen={setIsDataFiltersOpen}
        filterList={filterList}
        setFilterList={setFilterList}
        setLoadingState={setLoadingState}
      />
      {
      /* TODO: Make a function for the table so that a different sort is used per column type */
      }
      <Paper elevation={2} sx={{ marginBottom: 10 }}>
        <div>
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
            scrollHeight="calc(100vh - 500px)"
            paginator
            loading={loadingState}
            rows={25}
            resizableColumns
            columnResizeMode="expand"
            rowsPerPageOptions={[25, 50, 100, 500]}
            paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink JumpToPageDropDown"
            currentPageReportTemplate=" Viewing: {first} to {last} of {totalRecords}"
            paginatorPosition="bottom"
            paginatorRight
            header={header}
            onRowClick={rowClickHandler}
            selectionMode="single"
            filters={currentFilters}
            reorderableColumns
          >
            {sampleTableColumns.map((col: any) => (
              <Column
                key={col.field}
                field={col.field}
                header={col.header}
                body={BodyComponent({ col, readyFields })}
                hidden={col.hidden}
                sortable
                resizeable
                style={{ minWidth: '150px' }}
              />
            ))}
          </DataTable>
        </div>
      </Paper>
    </>
  );
}
export default Samples;
