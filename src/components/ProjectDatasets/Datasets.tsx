/* eslint-disable react/jsx-pascal-case */
import React, { useState, useEffect } from 'react';
import { IconButton, Snackbar, Alert, Dialog, Button, DialogActions, DialogContent, DialogTitle, Tooltip, Paper } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { MultiSelect, MultiSelectChangeEvent } from 'primereact/multiselect';
import { disableDataset, getDatasets } from '../../utilities/resourceUtils';
import { DataSetEntry, Project } from '../../types/dtos';
import { useApi } from '../../app/ApiContext';
import { ResponseObject } from '../../types/responseObject.interface';
import { ResponseType } from '../../constants/responseType';
import { isoDateLocalDate } from '../../utilities/helperUtils';
import { useAppSelector } from '../../app/store';
import LoadingState from '../../constants/loadingState';
import { selectUserState } from '../../app/userSlice';
import { PermissionLevel, hasPermission } from '../../permissions/accessTable';

interface DatasetProps {
  projectDetails: Project | null;
}

function Datasets(props: DatasetProps) {
  const { projectDetails } = props;
  const { token } = useApi();
  const [rows, setRows] = useState<DataSetEntry[]>([]);
  const [openSnackbar, setOpenSnackbar] = useState(false); // State for toast
  const [openDialog, setOpenDialog] = useState(false); // State for confirmation dialog
  const [dataSetIdToDelete, setDataSetIdToDelete] = useState<number | null>(null);
  const [datasetError, setDatasetError] = useState(false);
  const [columns, setColumns] = useState([
    { field: 'dataSetId', header: 'Dataset ID' },
    { field: 'fileName', header: 'File Name' },
    { field: 'analysisLabel', header: 'Analysis Label' },
    { field: 'createdBy', header: 'Created By' },
    { field: 'uploadedDate', header: 'Uploaded Date', body: (rowData: any) => isoDateLocalDate(rowData.uploadedDate) },
    { field: 'fields', header: 'Fields', body: (rowData: any) => rowData.fields.join(', ') },
  ]);
  const {
    data,
    loading,
    admin,
  } = useAppSelector(selectUserState);

  const renderDeleteButton = (
    rowData: any,
    canDelete: () => boolean,
    handleDeleteRow: (id: number) => void,
  ) => (
    canDelete() ? (
      <IconButton
        onClick={() => handleDeleteRow(rowData.dataSetId)}
        sx={{ color: 'gray' }}
        disabled={!canDelete()}
      >
        <DeleteOutlineIcon sx={{ '&:hover': { color: '#A81E2C' } }} />
      </IconButton>
    ) : (
      <Tooltip
        title="You don't have the role to perform this action"
      >
        <span>
          <IconButton sx={{ color: 'gray' }} disabled>
            <DeleteOutlineIcon />
          </IconButton>
        </span>
      </Tooltip>
    )
  );

  useEffect(() => {
    const fetchData = async () => {
      const response: ResponseObject = await getDatasets(projectDetails!.abbreviation, token);
      if (response.status === ResponseType.Success) {
        const newData = response.data.map((entry: any) => ({
          ...entry, // Spread the properties of the original entry
          uploadedDate: new Date(entry.uploadedDate), // Modify the uploadedDate property
        }));

        setRows(newData as DataSetEntry[]);
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
      setOpenDialog(false); // Close the dialog
      const response: ResponseObject =
        await disableDataset(projectDetails!.abbreviation, dataSetIdToDelete!, token);
      if (response.status !== ResponseType.Success) {
        throw new Error('Failed to disable dataset');
      }
      const updatedData = rows.filter((entry) => entry.dataSetId !== dataSetIdToDelete);
      setRows(updatedData);
      setOpenSnackbar(true); // Open toast on success
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error disabling dataset:', error);
      // Handle error appropriately
    } finally {
      setDataSetIdToDelete(null); // Clear the dataset ID after the operation
    }
  };

  const canDelete = () => {
    if (loading === LoadingState.SUCCESS && projectDetails !== null) {
      const rolesList = data[`${projectDetails.abbreviation}-Group`];
      return hasPermission(
        rolesList,
        'project/tabs/datasettab/datasettable',
        PermissionLevel.CanClick,
        admin,
      );
    }
    return false;
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

  const onColumnToggle = (event: MultiSelectChangeEvent) => {
    const selectedColumns = event.value as any[];
    const newColumns = columns.map((col: any) => {
      const newCol = { ...col };
      newCol.hidden = selectedColumns.some((selectedCol) => selectedCol.field === col.field);
      return newCol;
    });
    setColumns(newColumns);
  };

  const header = (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <MultiSelect
          value={columns.filter((col: any) => col.hidden === true)}
          options={columns}
          optionLabel="header"
          onChange={onColumnToggle}
          display="chip"
          placeholder="Hide Columns"
          className="w-full sm:w-20rem"
          filter
          showSelectAll
        />
      </div>
    </div>
  );

  return (
    (datasetError) ? (
      <Alert severity="error">
        Error loading datasets. Please contact an Admin
      </Alert>
    )
      : (
        <div>
          <Paper elevation={2} sx={{ marginBottom: 10 }}>
            <DataTable
              value={rows}
              size="small"
              columnResizeMode="expand"
              resizableColumns
              showGridlines
              reorderableColumns
              removableSort
              scrollable
              scrollHeight="calc(100vh - 500px)"
              header={header}
            >
              <Column
                header="Delete"
                body={(rowData: any) => renderDeleteButton(rowData, canDelete, handleDeleteRow)}
                style={{ width: '3rem' }}
                align="center"
              />
              {columns.map((col: any) => (
                <Column
                  key={col.field}
                  field={col.field}
                  header={col.header}
                  body={col.body}
                  hidden={col.hidden ?? false}
                  sortable
                  resizeable
                  style={{ minWidth: '150px' }}
                />
              ))}
            </DataTable>
          </Paper>
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
      )
  );
}

export default Datasets;
