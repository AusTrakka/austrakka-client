/* eslint-disable react/jsx-pascal-case */
import React, { useState, useEffect } from 'react';
import { IconButton, Snackbar, Alert, Dialog, Button, DialogActions, DialogContent, DialogTitle, Box } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MaterialReactTable, { MRT_ColumnDef, MRT_ShowHideColumnsButton, MRT_ToggleFiltersButton } from 'material-react-table';
import { disableDataset, getDatasets } from '../../utilities/resourceUtils';
import { DataSetEntry, Project } from '../../types/dtos';
import { useApi } from '../../app/ApiContext';
import { ResponseObject } from '../../types/responseObject.interface';
import { ResponseType } from '../../constants/responseType';
import { isoDateLocalDate } from '../../utilities/helperUtils';

interface DatasetProps {
  projectDetails: Project | null;
}

const datasetTableColumns: MRT_ColumnDef<DataSetEntry>[] = [
  { accessorKey: 'dataSetId', header: 'Data Set ID' },
  { accessorKey: 'fileName', header: 'File Name' },
  { accessorKey: 'analysisLabel', header: 'Analysis Label' },
  { accessorKey: 'uploadedDate', header: 'Uploaded Date', Cell: ({ cell }: any) => <>{isoDateLocalDate(cell.getValue())}</> },
  { accessorKey: 'fields', header: 'Fields', Cell: ({ cell }: any) => <>{cell.getValue().join(', ')}</> },
];

function Datasets(props: DatasetProps) {
  const { projectDetails } = props;
  const { token } = useApi();
  const [rows, setRows] = useState<DataSetEntry[]>([]);
  const [openSnackbar, setOpenSnackbar] = useState(false); // State for toast
  const [openDialog, setOpenDialog] = useState(false); // State for confirmation dialog
  const [dataSetIdToDelete, setDataSetIdToDelete] = useState<number | null>(null);
  const [datasetError, setDatasetError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const response: ResponseObject = await getDatasets(projectDetails!.abbreviation, token);
      if (response.status === ResponseType.Success) {
        setRows(response.data as DataSetEntry[]);
        setDatasetError(false); // Reset error state
      } else {
        setDatasetError(true);
      }
    };
    if (projectDetails) {
      fetchData();
    }
  }, [projectDetails, token]);

  const handleConfirmDisable = async () => {
    try {
      const response: ResponseObject =
        await disableDataset(projectDetails!.abbreviation, dataSetIdToDelete!, token);
      if (response.status !== ResponseType.Success) {
        throw new Error('Failed to disable dataset');
      }
      const updatedData = rows.filter((entry) => entry.dataSetId !== dataSetIdToDelete);
      setRows(updatedData);
      setOpenSnackbar(true); // Open toast on success
      setOpenDialog(false); // Close the dialog
    } catch (error) {
      console.error('Error disabling dataset:', error);
      // Handle error appropriately
    } finally {
      setDataSetIdToDelete(null); // Clear the dataset ID after the operation
    }
  };

  const handleDeleteRow = (row: number) => {
    setDataSetIdToDelete(row);
    setOpenDialog(true);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  return (
    <div>
      <MaterialReactTable
        columns={datasetTableColumns}
        data={rows}
        state={{
          showAlertBanner: datasetError,
        }}
        enableStickyHeader
        initialState={{ density: 'compact' }}
        enableColumnResizing
        enableFullScreenToggle={false}
        enableDensityToggle={false}
        muiTableProps={{
          sx: {
            'width': 'auto', 'tableLayout': 'auto', '& td:last-child': { width: '100%' }, '& th:last-child': { width: '100%' },
          },
        }}
        muiToolbarAlertBannerProps={
          datasetError
            ? {
              color: 'error',
              children: 'Failed to load datasets',
            }
            : undefined
        }
        renderToolbarInternalActions={({ table }) => (
          <Box>
            <MRT_ToggleFiltersButton table={table} />
            <MRT_ShowHideColumnsButton table={table} />
          </Box>
        )}
        enableRowActions
        renderRowActions={({ row }) => (
          <IconButton
            onClick={() => handleDeleteRow(row.getValue('dataSetId'))}
            sx={{ color: 'gray' }}
          >
            <DeleteOutlineIcon sx={{ '&:hover': { color: '#A81E2C' } }} />
          </IconButton>
        )}
      />
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={openSnackbar}
        autoHideDuration={5000} // Duration (ms)
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          Successfully Removed Dataset
        </Alert>
      </Snackbar>
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Confirm Dataset Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this dataset? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleConfirmDisable}>Confirm</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default Datasets;
