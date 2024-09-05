/* eslint-disable react/jsx-pascal-case */
import React, { useState, useEffect } from 'react';
import { IconButton, Snackbar, Alert, Dialog, Button, DialogActions, DialogContent, DialogTitle, Paper, Tooltip } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { DataTable, DataTableFilterMeta, DataTableFilterMetaData } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FilterMatchMode } from 'primereact/api';
import { HelpOutline } from '@mui/icons-material';
import { disableDataset, getDatasets } from '../../utilities/resourceUtils';
import { DataSetEntry, Project } from '../../types/dtos';
import { useApi } from '../../app/ApiContext';
import { ResponseObject } from '../../types/responseObject.interface';
import { ResponseType } from '../../constants/responseType';
import { useAppSelector } from '../../app/store';
import LoadingState from '../../constants/loadingState';
import { UserSliceState, selectUserState } from '../../app/userSlice';
import { PermissionLevel, hasPermission } from '../../permissions/accessTable';
import ColumnVisibilityMenu from '../TableComponents/ColumnVisibilityMenu';
import SearchInput from '../TableComponents/SearchInput';
import sortIcon from '../TableComponents/SortIcon';
import { isoDateLocalDate } from '../../utilities/dateUtils';

interface DatasetProps {
  projectDetails: Project | null;
  mergeAlgorithm: string | null;
}

function Datasets(props: DatasetProps) {
  const { projectDetails, mergeAlgorithm } = props;
  const { token } = useApi();
  const [rows, setRows] = useState<DataSetEntry[]>([]);
  const [openSnackbar, setOpenSnackbar] = useState(false); // State for toast
  const [openDialog, setOpenDialog] = useState(false); // State for confirmation dialog
  const [dataSetIdToDelete, setDataSetIdToDelete] = useState<number | null>(null);
  const [datasetError, setDatasetError] = useState(false);
  const [globalFilter, setGlobalFilter] = useState<DataTableFilterMeta>(
    { global: { value: null, matchMode: FilterMatchMode.CONTAINS } },
  );
  const [columns, setColumns] = useState([
    { field: 'dataSetId', header: 'Dataset ID' },
    { field: 'fileName', header: 'File Name' },
    { field: 'analysisLabel', header: 'Analysis Label' },
    { field: 'createdBy', header: 'Created By' },
    { field: 'uploadedDate', header: 'Uploaded Date', body: (rowData: any) => isoDateLocalDate(rowData.uploadedDate) },
    { field: 'fields', header: 'Fields', body: (rowData: any) => rowData.fields.join(', ') },
  ]);
  const user: UserSliceState = useAppSelector(selectUserState);

  const renderDeleteButton = (
    rowData: any,
    handleDeleteRow: (id: number) => void,
  ) => (
    <IconButton
      onClick={() => handleDeleteRow(rowData.dataSetId)}
      sx={{ color: 'gray' }}
      size="small"
    >
      <DeleteOutlineIcon sx={{ '&:hover': { color: '#A81E2C' } }} />
    </IconButton>
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
    if (user.loading === LoadingState.SUCCESS && projectDetails !== null) {
      return hasPermission(
        user,
        `${projectDetails.abbreviation}-Group`,
        'project/tabs/datasettab/datasettable',
        PermissionLevel.CanClick,
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

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const filters = { ...globalFilter };
    (filters.global as DataTableFilterMetaData).value = value;
    setGlobalFilter(filters);
  };

  const header = (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <SearchInput
          value={(globalFilter.global as DataTableFilterMetaData).value || ''}
          onChange={onGlobalFilterChange}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'center' }}>
          {mergeAlgorithm && (
          <Tooltip placement="top" title={`Merge Algorithm: ${mergeAlgorithm}`}>
            <IconButton
              sx={{ mr: 0.5 }}
              disableTouchRipple
            >
              <HelpOutline color="action" fontSize="small" />
            </IconButton>
          </Tooltip>
          )}
          <ColumnVisibilityMenu
            columns={columns}
            onColumnVisibilityChange={(selectedCols) => {
              const newColumns = columns.map((col: any) => {
                const newCol = { ...col };
                newCol.hidden = selectedCols.some(
                  (selectedCol: any) => selectedCol.field === col.field,
                );
                return newCol;
              });
              setColumns(newColumns);
            }}
          />
        </div>
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
              filters={globalFilter}
              globalFilterFields={columns.map((col) => col.field)}
              sortIcon={sortIcon}
            >
              {canDelete() ? (
                <Column
                  header="Delete"
                  body={(rowData: any) => renderDeleteButton(rowData, handleDeleteRow)}
                  style={{ width: '3rem' }}
                  align="center"
                />
              ) : null}
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
                  headerClassName="custom-title"
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
