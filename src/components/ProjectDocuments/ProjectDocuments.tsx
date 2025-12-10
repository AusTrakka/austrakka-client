import React, { useState, useEffect, memo } from 'react';
import { DataTable, DataTableFilterMeta, DataTableFilterMetaData } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { IconButton, Paper, Menu, MenuItem, ListItemIcon, ListItemText, MenuList, Divider, Drawer, Box, Typography, Button, Stack, Collapse, CircularProgress } from '@mui/material';
import { DeleteOutline, DescriptionRounded, ErrorOutline, FileDownloadOutlined, MoreHoriz, OpenInNew, PreviewOutlined } from '@mui/icons-material';
import { FilterMatchMode } from 'primereact/api';
import Grid from '@mui/material/Grid2';
import { Project } from '../../types/dtos';
import { isoDateLocalDate } from '../../utilities/dateUtils';
import { ResponseObject } from '../../types/responseObject.interface';
import { deleteDocument, downloadDocument, getDocuments, previewDocument } from '../../utilities/resourceUtils';
import { useApi } from '../../app/ApiContext';
import { ResponseType } from '../../constants/responseType';
import sortIcon from '../TableComponents/SortIcon';
import ColumnVisibilityMenu from '../TableComponents/ColumnVisibilityMenu';
import SearchInput from '../TableComponents/SearchInput';
import { FileIcon } from './FileIcon';
import { formatFileSize } from '../../utilities/renderUtils';

// TODO:
// - After file is downloaded successfully show "FileDownloadDoneIcon" for a brief period
// - Remove all "any" types and replace with proper typing
// - Open "Quick preview" should set url id 
// - "Quick preview" should use url id to get details and preview - so that ppl nav to link
// - Update previewFile, preview, activeRow to something slightly cleaner
// - Add download and delete buttons in file preview
// - Permissions check 
// - Clean up all styles and colour references
// - "Are you sure you want to delete this file" alert prior to delete
// - Check loading/error states are present in all relevant locations

interface PreviewFileState {
  name: string;
  extension: string;
  url?: string;
  loading: boolean;
  error?: string;
  type: 'file' | 'icon';
  row: any;
}

interface ProjectDocumentsProps {
  projectDetails: Project | null;
}
function ProjectDocuments(props: ProjectDocumentsProps) {
  const { projectDetails } = props;
  const { token } = useApi();
  const [error, setError] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeRow, setActiveRow] = useState<any>(null);
  const rowMenuOpen = Boolean(anchorEl);
  // const [documentsError, setDocumentsError] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [globalFilter, setGlobalFilter] = useState<DataTableFilterMeta>(
    { global: { value: null, matchMode: FilterMatchMode.CONTAINS } },
  );
  const [preview, setPreview] = useState<PreviewFileState | null>(null);

  const PREVIEWABLE_EXTENSIONS = [
    'pdf',
    'txt',
    'html',
  ];

  // Custom file name column body to render file type icons
  const fileNameColumnBody = (rowData: any, field: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <FileIcon filename={rowData[field]} />
      {rowData[field] === null || rowData[field] === '' ? <div /> : rowData[field]}
    </div>
  );

  const [columns, setColumns] = useState([
    { field: 'fileName', header: 'File name', body: (rowData: any) => fileNameColumnBody(rowData, 'fileName') },
    { field: 'description', header: 'Description' },
    { field: 'fileSize', header: 'File Size', body: (rowData: any) => formatFileSize(rowData.fileSize, true) },
    { field: 'createdBy', header: 'Created By' },
    { field: 'uploadedDate', header: 'Uploaded Date', body: (rowData: any) => isoDateLocalDate(rowData.uploadedDate) },
  ]);
  // const user: UserSliceState = useAppSelector(selectUserState);
  
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, rowData: any) => {
    event.stopPropagation();
    setActiveRow(rowData);
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
    setActiveRow(null);
  };

  useEffect(() => {
    const fetchData = async () => {
      const response: ResponseObject = await getDocuments(projectDetails!.abbreviation, token);
      if (response.status === ResponseType.Success) {
        const newData = response.data;
        setDocuments(newData as any);
        setError(false);
      } else {
        setError(true);
      }
    };
    if (projectDetails) {
      fetchData();
    }
  }, [projectDetails, token]);

  const refreshDocuments = async () => {
    setDownloading(true);
    const response = await getDocuments(projectDetails!.abbreviation, token);
    if (response.status === ResponseType.Success) {
      setDocuments(response.data);
      setDownloading(false);
    } else {
      setDownloading(false);
      setError(true);
    }
  };

  // const response = await uploadDocument(projectDetails!.abbreviation, formData, token);
  const handleDownload = async () => {
    setDownloading(true);
    // TODO: New document util just to handle downloading maybe?
    try {
      const { blob, suggestedFilename } = await downloadDocument(
        projectDetails!.abbreviation,
        activeRow.id,
        token,
      );
      
      // Create a URL for the Blob object
      const blobUrl = URL.createObjectURL(blob);

      // Create a temporary link element to trigger the download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = suggestedFilename;
      link.click();

      // Clean up the URL and remove the link
      URL.revokeObjectURL(blobUrl);
      link.remove();
      setError(false);
      setDownloading(false);

      // Hide the in row menu
      setAnchorEl(null);
      setActiveRow(null);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error:', e);
      setError(true);
      setDownloading(false);
    }
  };
  // TODO: Only allow "previewable types" to be previewed in new tab or in side drawer
  const handlePreviewNewTab = async () => {
    try {
      const { blob } = await previewDocument(
        projectDetails!.abbreviation,
        activeRow.id,
        token,
      );
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      setError(false);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error:', e);
      setError(true);
    }
  };

  const handleDelete = async () => {
    // Hide the in row menu
    setAnchorEl(null);
    setActiveRow(null);
    try {
      const response = await deleteDocument(
        projectDetails!.abbreviation,
        activeRow.id,
        token,
      );
      if (response.status === ResponseType.Success) {
        await refreshDocuments();
      }
      setError(false);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error:', e);
      setError(true);
    }
  };

  const canPreviewFileByExtension = (row: any) => {
    if (!row) return false;
    const filename = row.fileName;
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext ? PREVIEWABLE_EXTENSIONS.includes(ext) : false;
  };

  const getFileExtension = (filename: string = '') =>
    filename.split('.').pop()?.toLowerCase() || '';

  const handlePreviewQuick = async () => {
    if (!activeRow) return;
    const row = activeRow;
    const ext = getFileExtension(row.fileName);
    const isPreviewable = PREVIEWABLE_EXTENSIONS.includes(ext);

    setPreviewFile(activeRow);
    setPreviewLoading(true);
    setDrawerOpen(true);

    setAnchorEl(null);
    try {
      if (isPreviewable) {
      // Fetch preview Blob via API
        const { blob } = await previewDocument(
          projectDetails!.abbreviation,
          row.id,
          token,
        );

        const blobUrl = URL.createObjectURL(blob);
        setPreview({
          type: 'file',
          url: blobUrl,
          extension: ext,
          row,
          name: row.fileName,
          loading: false,
          error: undefined,
        });
      } else {
      // Non-previewable → fallback to icon mode
        setPreview({
          type: 'icon',
          extension: ext,
          row,
          name: row.fileName,
          loading: false,
          error: undefined,
        });
      }

      setError(false);
    } catch (err) {
      console.error(err);
      setError(true);

      // If API preview fails, fallback to icon
      setPreview({
        type: 'icon',
        extension: ext,
        row,
        name: row.fileName,
        loading: false,
        error: undefined,
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  // const handleRowSelect = (row: any) => {
  //   // TODO: Update so that quick preview is triggered (if wanted)
  //   console.log(row);
  // };

  const rowActions = (rowData: any) => (
    <Grid sx={{ textAlign: 'right' }}>
      <IconButton
        aria-label="more"
        onClick={(e) => { handleMenuClick(e, rowData); }}
        id="basic-button"
        aria-controls={rowMenuOpen ? 'basic-menu' : undefined}
        aria-expanded={rowMenuOpen ? 'true' : undefined}
        aria-haspopup="true"
      >
        <MoreHoriz />
      </IconButton>
    </Grid>
  );

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
    <>
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              maxWidth: 600,
              minWidth: 500,
              // padding: 4,
              borderLeft: 6,
              borderColor: 'secondary.main',
              height: '100%',
            },
          },
        }}
      >
        <Box role="presentation" onKeyDown={() => setDrawerOpen(false)} sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Grid container spacing={1} sx={{ width: 'fit-content', padding: 4 }} justifyContent="flex-start" alignItems="flex-start">
            <Grid size={{ xs: 12 }}>
              <Typography variant="h5" color="primary">
                {previewFile?.fileName}
              </Typography>
            </Grid>
            <Grid container size={{ xs: 12 }} spacing={1} alignItems="center" justifyContent="flex-start">
              <Grid size={{ sm: 'auto' }} sx={{ display: 'flex', alignItems: 'center' }}>
                <FileIcon filename={previewFile?.fileName} size={18} />
              </Grid>
              <Grid size={{ sm: 'auto' }} sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography>
                  {formatFileSize(previewFile?.fileSize)}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
          <Divider />
          <Grid container size={{ xs: 12 }} spacing={1} sx={{ px: 4, py: 2 }} alignItems="center">
            <Stack spacing={1} direction="row" sx={{ width: '100%' }}>
              <Button variant="contained" size="small" startIcon={<FileDownloadOutlined fontSize="small" />} sx={{ textTransform: 'none' }}>
                Download
              </Button>
              <Button variant="contained" size="small" startIcon={<OpenInNew />} sx={{ textTransform: 'none' }}>
                Open new tab
              </Button>
              <Button variant="contained" size="small" startIcon={<DeleteOutline />} sx={{ textTransform: 'none' }}>
                Delete
              </Button>
            </Stack>
          </Grid>
          <Divider />
          {preview && (
            <>
              {!previewLoading && preview.type === 'file' && preview.url && (
              <Box sx={{ flex: 1, mt: 1, border: '1px solid #ccc', margin: 2, borderRadius: 1 }}>
                <iframe
                  title={preview.row.fileName}
                  src={preview.url}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              </Box>
              )}
              {!previewLoading && preview.type === 'icon' && (
              <Box
                sx={{
                  flex: 1,
                  mt: 1,
                  border: '1px solid var(--primary-grey)',
                  backgroundColor: 'var(--primary-grey)',
                  color: 'var(--secondary-dark-grey)',
                  borderRadius: 1,
                  padding: 4,
                  margin: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                }}
              >
                <DescriptionRounded sx={{ margin: 1, fontSize: 48 }} color="disabled" />
                <Typography color="textDisabled">
                  Sorry! Preview is not available for this file type.
                </Typography>
              </Box>
              )}
            </>
          )}

        </Box>
      </Drawer>
      {error ? <ErrorOutline color="error" /> : null}
      <Paper elevation={2} sx={{ marginBottom: 10 }}>
        <DataTable
          value={documents}
          size="small"
          columnResizeMode="expand"
          resizableColumns
          removableSort
          scrollable
          header={header}
          filters={globalFilter}
          // onRowClick={(e) => handleRowSelect(e)}
          // selectionMode="single"
          selection={activeRow}
          globalFilterFields={columns.map((col) => col.field)}
          sortIcon={sortIcon}
          className="my-flexible-table"
          scrollHeight="calc(100vh - 400px)"
          paginator
          paginatorRight
          rows={25}
          rowsPerPageOptions={[25, 50, 100, 500]}
          paginatorTemplate="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink JumpToPageDropDown"
          currentPageReportTemplate=" Viewing: {first} to {last} of {totalRecords}"
        >
          {columns.map((col: any) => (
            <Column
              key={col.field}
              field={col.field}
              header={col.header}
              body={col.body}
              sortable
              resizeable
              className="flexible-column"
              style={{ minWidth: '150px' }}
              headerClassName="custom-title"
              bodyClassName="value-cells"
            />
          ))}
          <Column
            header=""
            body={(rowData) => rowActions(rowData)}
            className="flexible-column"
            headerClassName="custom-title"
            bodyClassName="value-cells"
          />
        </DataTable>
      </Paper>
      <Menu
        anchorEl={anchorEl}
        open={rowMenuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            elevation: 2,
          },
        }}
      >
        <MenuList dense sx={{ paddingTop: 0, paddingBottom: 0 }}>
          <MenuItem onClick={() => handleDownload()} disabled={downloading}>
            <ListItemIcon>
              { downloading ?
                <CircularProgress />
                :
                <FileDownloadOutlined fontSize="small" sx={{ color: 'var(--primary-main)' }} />}
            </ListItemIcon>
            <ListItemText sx={{ color: 'var(--primary-main)' }}>Download</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handlePreviewQuick()}>
            <ListItemIcon><PreviewOutlined fontSize="small" sx={{ color: 'var(--primary-main)' }} /></ListItemIcon>
            <ListItemText sx={{ color: 'var(--primary-main)' }}>Quick preview</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => handlePreviewNewTab()}
            disabled={!canPreviewFileByExtension(activeRow)}
          >
            <ListItemIcon><OpenInNew fontSize="small" sx={{ color: 'var(--primary-main)' }} /></ListItemIcon>
            <ListItemText sx={{ color: 'var(--primary-main)' }}>Preview in new tab</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => handleDelete()}>
            <ListItemIcon><DeleteOutline fontSize="small" sx={{ color: 'var(--secondary-red)' }} /></ListItemIcon>
            <ListItemText sx={{ color: 'var(--secondary-red)' }}>Delete</ListItemText>
          </MenuItem>
        </MenuList>
      </Menu>
    </>
  );
}
export default memo(ProjectDocuments);
