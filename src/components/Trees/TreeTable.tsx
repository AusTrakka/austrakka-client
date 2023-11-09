import MaterialReactTable, { MRT_ColumnDef, MRT_RowSelectionState, MRT_TableInstance } from 'material-react-table';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { VisibilityOff, Visibility } from '@mui/icons-material';
import { DisplayField } from '../../types/dtos';
import { buildMRTColumnDefinitions, compareFields } from '../../utilities/tableUtils';

interface TreeTableProps {
  selectedIds: string[],
  setSelectedIds: any,
  rowSelection: any,
  setRowSelection: any,
  displayFields: DisplayField[],
  tableMetadata: any
}
// TODO: Pass down any relevant error states for samples/display fields

export default function TreeTable(props: TreeTableProps) {
  const {
    selectedIds, setSelectedIds, rowSelection, setRowSelection, displayFields, tableMetadata,
  } = props;
  const tableInstanceRef = useRef<MRT_TableInstance>(null);
  const [sampleTableColumns, setSampleTableColumns] = useState<MRT_ColumnDef[]>([]);
  const [columnError, setColumnError] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [displayRows, setDisplayRows] = useState([]);

  // Format display fields into column headers
  useEffect(
    () => {
      // BUILD COLUMNS
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

  useEffect(() => {
    setDisplayRows(tableMetadata);
  }, [tableMetadata]);

  const rowVisibilityHandler = () => {
    const newState = !isHidden;
    if (newState === true) {
      // Filter rows based on ID field
      const filtered = tableMetadata.filter((e: any) => selectedIds.includes(e.sampleName));
      setDisplayRows(filtered);
    } else {
      setDisplayRows(tableMetadata);
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

  return (
    <MaterialReactTable
      tableInstanceRef={tableInstanceRef}
      columns={sampleTableColumns}
      data={displayRows}
      enableRowSelection
      getRowId={(row) => row.sampleName}
      onRowSelectionChange={(row) => handleRowSelect(row)}
      state={{ rowSelection }}
      initialState={{ density: 'compact' }}
      positionToolbarAlertBanner="none"
      enableDensityToggle={false}
      enableFullScreenToggle={false}
      enableGlobalFilter={false}
      enableColumnFilters={false}
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
    />

  );
}
