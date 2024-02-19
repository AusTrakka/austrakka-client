import MaterialReactTable, { MRT_ColumnDef, MRT_TableInstance } from 'material-react-table';
import React, { useEffect, useRef, useState } from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { VisibilityOff, Visibility } from '@mui/icons-material';
import { Field } from '../../types/dtos';
import { buildMRTColumnDefinitions, compareFields } from '../../utilities/tableUtils';
import DataFilters, { DataFilter } from '../DataFilters/DataFilters';
import ExportTableData from '../Common/ExportTableData';
import LoadingState from '../../constants/loadingState';
import MetadataLoadingState from '../../constants/metadataLoadingState';
import { Sample } from '../../types/sample.interface';

interface TreeTableProps {
  selectedIds: string[],
  setSelectedIds: any,
  rowSelection: any,
  setRowSelection: any,
  displayFields: Field[],
  tableMetadata: any,
  metadataLoadingState: MetadataLoadingState,
}
// TODO: Fix column hiding/showing functionaility

export default function TreeTable(props: TreeTableProps) {
  const {
    selectedIds,
    setSelectedIds,
    rowSelection,
    setRowSelection,
    displayFields,
    tableMetadata,
    metadataLoadingState,
  } = props;
  const [formattedData, setFormattedData] = useState([]);
  const tableInstanceRef = useRef<MRT_TableInstance>(null);
  const [sampleTableColumns, setSampleTableColumns] = useState<MRT_ColumnDef<Sample>[]>([]);
  const [columnError, setColumnError] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [displayRows, setDisplayRows] = useState<Sample[]>([]);
  const [filteredData, setFilteredData] = useState([]);
  const [exportCSVStatus, setExportCSVStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [isDataFiltersOpen, setIsDataFiltersOpen] = useState(true);
  const [filterList, setFilterList] = useState<DataFilter[]>([]);

  // Format display fields into column headers
  useEffect(
    () => {
      const formatTableHeaders = () => {
        const copy = [...displayFields];
        const sortedDisplayFields = copy.sort(compareFields);
        const columnBuilder = buildMRTColumnDefinitions(sortedDisplayFields);
        setSampleTableColumns(columnBuilder);
        setColumnError(false);
      };
      if (!columnError) {
        formatTableHeaders();
      }
    },
    [columnError, displayFields],
  );

  // Format tableMetadata in the correct way for the table to ingest
  useEffect(() => {
    const tableValues: any = [];
    const fields = displayFields.map(field => field.columnName);
    // Find display field matches in top level object and in metadataValues kv pairs
    tableMetadata.forEach((element: any) => {
      const entry: any = {};
      for (const [key, value] of Object.entries(element) as [key: string, value: any]) {
        if (fields.includes(key)) {
          entry[key] = value;
        } else if (key === 'sampleName') {
          entry.Seq_ID = value;
        } else if (key === 'metadataValues') {
          value.forEach((kv: any) => {
            if (fields.includes(kv.key)) {
              entry[kv.key] = kv.value;
            }
          });
        }
      }
      tableValues.push(entry);
    });
    setFormattedData(tableValues);
  }, [tableMetadata, displayFields]);

  useEffect(() => {
    setFilteredData(formattedData);
    setDisplayRows(formattedData);
  }, [formattedData]);

  const rowVisibilityHandler = () => {
    const newState = !isHidden;
    if (newState === true) {
      // Filter rows based on ID field
      const filtered = filteredData.filter((e: any) => selectedIds.includes(e.Seq_ID));
      setDisplayRows(filtered);
    } else {
      setDisplayRows(filteredData);
    }
    setIsHidden(newState);
  };

  const handleRowSelect = (row: any) => {
    setRowSelection(row);
    setSelectedIds(Object.keys(row));
  };

  useEffect(() => {
    setSelectedIds(Object.keys(rowSelection));
  }, [rowSelection, setSelectedIds]);

  useEffect(() => {
    // If table filter changes, show all rows again and unselect all
    setDisplayRows(filteredData);
    setIsHidden(false);
    setRowSelection([]);
  }, [filteredData, setRowSelection]);

  // Dynamically show extra rows as they are selected
  useEffect(() => {
    if (isHidden === true) {
      const filtered = filteredData.filter((e: any) => selectedIds.includes(e.Seq_ID));
      setDisplayRows(filtered);
    } else {
      setDisplayRows(filteredData);
    }
  }, [filteredData, isHidden, selectedIds]);

  // Update CSV export status as data loads
  // CSV export is not permitted until data is FULLY loaded
  // If a load error occurs, we will pass no data to the ExportTableData component
  // However we don't set an error here as we want to see a load error, not CSV download error
  useEffect(() => {
    setExportCSVStatus(
      metadataLoadingState === MetadataLoadingState.IDLE ||
      metadataLoadingState === MetadataLoadingState.AWAITING_DATA ||
      metadataLoadingState === MetadataLoadingState.PARTIAL_DATA_LOADED ?
        LoadingState.LOADING :
        LoadingState.SUCCESS,
    );
  }, [metadataLoadingState]);

  return (
    <>
      <DataFilters
        data={formattedData}
        fields={displayFields}
        setFilteredData={setFilteredData}
        filterList={filterList}
        setFilterList={setFilterList}
        isOpen={isDataFiltersOpen}
        setIsOpen={setIsDataFiltersOpen}
      />
      <MaterialReactTable
        tableInstanceRef={tableInstanceRef}
        columns={sampleTableColumns as any} // unclear MRT_ColumnDef/MRT_TableInstance templates
        data={displayRows}
        enableRowSelection
        muiTableBodyRowProps={({ row }) => ({
          onClick: row.getToggleSelectedHandler(),
          sx: { cursor: 'pointer' },
        })}
        getRowId={(originalRow: Sample) => originalRow.Seq_ID}
        onRowSelectionChange={(row) => handleRowSelect(row)}
        state={{ rowSelection }}
        enableHiding={false}
        initialState={{ density: 'compact' }}
        positionToolbarAlertBanner="none"
        enableDensityToggle={false}
        selectAllMode="all"
        enableFullScreenToggle={false}
        enableGlobalFilter={false}
        enableColumnFilters={false}
        enableRowVirtualization
        renderTopToolbarCustomActions={() => (
          <Box sx={{ display: 'flex', gap: '1rem', p: '4px' }} alignItems="center">
            <IconButton
              onClick={() => {
                rowVisibilityHandler();
              }}
            >
              <Tooltip title={isHidden ? 'Show unselected rows' : 'Hide unselected rows'} arrow>
                {isHidden ?
                  <Visibility />
                  :
                  <VisibilityOff />}
              </Tooltip>
            </IconButton>
            <Typography variant="caption">
              {`${Object.keys(rowSelection).length} row(s) selected`}
            </Typography>
          </Box>
        )}
        renderToolbarInternalActions={() => (
          <ExportTableData
            dataToExport={displayRows}
            exportCSVStatus={exportCSVStatus}
            setExportCSVStatus={setExportCSVStatus}
          />
        )}
      />
    </>
  );
}
