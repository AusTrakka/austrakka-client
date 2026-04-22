import {
  CheckCircleOutlined,
  DeleteOutline,
  Edit,
  FileDownloadOutlined,
  MoreHoriz,
  OpenInNew,
  UploadFile,
} from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Paper,
  Typography,
} from '@mui/material';

import Grid from '@mui/material/Grid2';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import {
  DataTable,
  type DataTableFilterMeta,
  type DataTableFilterMetaData,
} from 'primereact/datatable';
import type React from 'react';
import { memo, useEffect, useState } from 'react';
import { useApi } from '../../app/ApiContext';
import { useAppSelector } from '../../app/store';
import { selectUserState, type UserSliceState } from '../../app/userSlice';
import { Theme } from '../../assets/themes/theme';
import LoadingState from '../../constants/loadingState';
import RecordTypes from '../../constants/record-type.enum';
import { ResponseType } from '../../constants/responseType';
import { hasPermissionV2ByRole } from '../../permissions/accessTable';
import { RoleV2SeededName } from '../../permissions/roles';
import type { Project, ProjectDocument } from '../../types/dtos';
import type { ResponseObject } from '../../types/responseObject.interface';
import { isoDateLocalDate } from '../../utilities/dateUtils';
import { formatFileSize } from '../../utilities/renderUtils';
import { downloadDocument, getDocuments } from '../../utilities/resourceUtils';
import type { PrimeReactColumnDefinition } from '../../utilities/tableUtils';
import SearchInput from '../TableComponents/SearchInput';
import sortIcon from '../TableComponents/SortIcon';
import DeleteDocument from './DeleteDocument';
import EditDocumentDetails from './EditDocumentDetails';
import { FileIcon } from './FileIcon';
import UploadDocument from './UploadDocument';

interface ProjectDocumentsProps {
  projectDetails: Project | null;
}

function ProjectDocuments(props: ProjectDocumentsProps) {
  const { projectDetails } = props;
  const { token } = useApi();

  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [, setPreviewFile] = useState<LoadingState>(LoadingState.IDLE);
  const [downloadingFiles, setDownloadingFiles] = useState<Map<number, LoadingState>>(new Map());
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeRow, setActiveRow] = useState<ProjectDocument | null>(null);
  const rowMenuOpen = Boolean(anchorEl);
  const [editDetailsOpen, setEditDetailsOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const user: UserSliceState = useAppSelector(selectUserState);
  const [canEditDelete, setCanEditDelete] = useState(false);

  useEffect(() => {
    if (user && projectDetails) {
      const hasEditDeletePermission: boolean = hasPermissionV2ByRole(
        user,
        RoleV2SeededName.ProjectAnalyst,
        projectDetails?.abbreviation,
        RecordTypes.PROJECT,
      );
      setCanEditDelete(hasEditDeletePermission);
    }
  }, [user, projectDetails]);

  const getDownloadState = (id: number) => downloadingFiles.get(id) ?? LoadingState.IDLE;
  const setDownloadState = (id: number, state: LoadingState) => {
    setDownloadingFiles((prev) => new Map(prev).set(id, state));
  };

  // Custom file type column body to render file type icons
  const fileTypeColumnBody = (rowData: ProjectDocument) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <FileIcon filename={rowData.fileName} />
    </div>
  );

  const columns = [
    {
      field: 'fileName',
      header: 'File name',
    },
    {
      field: 'description',
      header: 'Description',
    },
    {
      field: 'fileSize',
      header: 'File Size',
      body: (rowData: ProjectDocument) => formatFileSize(rowData.fileSize, true),
    },
    { field: 'createdBy', header: 'Created By' },
    {
      field: 'uploadedDate',
      header: 'Uploaded Date',
      body: (rowData: ProjectDocument) => isoDateLocalDate(rowData.uploadedDate.toString()),
    },
  ];

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, rowData: ProjectDocument) => {
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
      setStatus(LoadingState.LOADING);
      const response: ResponseObject = await getDocuments(projectDetails!.abbreviation, token);
      if (response.status === ResponseType.Success) {
        setDocuments(response.data as ProjectDocument[]);
        setStatus(LoadingState.SUCCESS);
      } else {
        setStatus(LoadingState.ERROR);
      }
    };
    if (projectDetails) {
      fetchData();
    }
  }, [projectDetails, token]);

  const refreshDocuments = async () => {
    setAnchorEl(null);
    setActiveRow(null);
    setStatus(LoadingState.LOADING);
    const response = await getDocuments(projectDetails!.abbreviation, token);
    if (response.status === ResponseType.Success) {
      setDocuments(response.data as ProjectDocument[]);
      setStatus(LoadingState.SUCCESS);
    } else {
      setStatus(LoadingState.ERROR);
    }
  };

  const handleDownload = async (projectDoc: ProjectDocument) => {
    const documentId = projectDoc.id;
    setDownloadState(documentId, LoadingState.LOADING);
    try {
      const { blob, suggestedFilename } = await downloadDocument(
        projectDetails!.abbreviation,
        documentId,
        token,
      );

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = suggestedFilename;
      link.click();

      URL.revokeObjectURL(blobUrl);
      link.remove();
      setDownloadState(documentId, LoadingState.SUCCESS);
      // Reset the download state after 3 seconds
      setTimeout(() => {
        setDownloadState(documentId, LoadingState.IDLE);
      }, 3000);
    } catch {
      setDownloadState(documentId, LoadingState.ERROR);
    }
  };

  const handlePreviewNewTab = async (projectDoc: ProjectDocument) => {
    if (!projectDoc) return;
    try {
      window.open(
        `/projects/${projectDetails!.abbreviation}/documents/${projectDoc.id}/preview`,
        '_blank',
      );
      setPreviewFile(LoadingState.SUCCESS);
    } catch {
      setPreviewFile(LoadingState.ERROR);
    }
  };

  const rowActions = (rowData: ProjectDocument) => (
    <Grid sx={{ textAlign: 'right' }}>
      <IconButton
        onClick={(e) => {
          handleMenuClick(e, rowData);
        }}
        id="basic-button"
        sx={{ padding: 0.2, margin: 0 }}
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
    <div
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <SearchInput
          value={(globalFilter.global as DataTableFilterMetaData).value || ''}
          onChange={onGlobalFilterChange}
        />
        <Box style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          {canEditDelete && (
            <Button
              onClick={() => {
                setUploadOpen(true);
              }}
              disabled={false}
              variant="outlined"
              startIcon={<UploadFile />}
              sx={{ textTransform: 'none' }}
            >
              Upload
            </Button>
          )}
        </Box>
      </div>
    </div>
  );

  const getDownloadListRow = (documentId: number) => {
    const downloadState = getDownloadState(documentId);

    if (downloadState === LoadingState.LOADING) {
      return (
        <>
          <ListItemIcon>
            <CircularProgress size={18} />
          </ListItemIcon>
          <ListItemText sx={{ color: Theme.PrimaryMain }}>Downloading...</ListItemText>
        </>
      );
    }
    if (downloadState === LoadingState.SUCCESS) {
      return (
        <>
          <ListItemIcon>
            <CheckCircleOutlined fontSize="small" sx={{ color: 'success.main' }} />
          </ListItemIcon>
          <ListItemText sx={{ color: 'success.main' }}>Downloaded</ListItemText>
        </>
      );
    }
    return (
      <>
        <ListItemIcon>
          <FileDownloadOutlined fontSize="small" sx={{ color: Theme.PrimaryMain }} />
        </ListItemIcon>
        <ListItemText sx={{ color: Theme.PrimaryMain }}>Download</ListItemText>
      </>
    );
  };

  return (
    <>
      {editDetailsOpen && canEditDelete && (
        <EditDocumentDetails
          open={editDetailsOpen}
          onClose={() => setEditDetailsOpen(false)}
          activeDocument={activeRow as ProjectDocument}
          abbreviation={projectDetails?.abbreviation || ''}
          refresh={refreshDocuments}
        />
      )}
      {uploadOpen && canEditDelete && (
        <UploadDocument
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          abbreviation={projectDetails?.abbreviation || ''}
          refresh={refreshDocuments}
        />
      )}
      {deleteAlertOpen && canEditDelete && (
        <DeleteDocument
          open={deleteAlertOpen}
          onClose={() => setDeleteAlertOpen(false)}
          activeDocument={activeRow as ProjectDocument}
          projectAbbrev={projectDetails?.abbreviation || ''}
          refreshDocuments={refreshDocuments}
        />
      )}
      <Typography variant="subtitle2" paddingBottom={1}>
        This page lists approved project documents and reports.
      </Typography>
      <Paper elevation={2} sx={{ marginBottom: 10 }}>
        <DataTable
          value={documents}
          loading={status === LoadingState.LOADING}
          size="small"
          removableSort
          scrollable
          header={header}
          filters={globalFilter}
          showGridlines
          selectionMode="single"
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
          <Column
            key="fileType"
            body={fileTypeColumnBody}
            sortable
            sortField="fileType"
            headerClassName="custom-title"
            style={{ width: '1rem' }}
            sortFunction={(e) => {
              const getExt = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';
              return [...e.data].sort((a, b) => {
                const extA = getExt(a.fileName);
                const extB = getExt(b.fileName);
                return e.order! * extA.localeCompare(extB);
              });
            }}
          />
          {columns.map((col: PrimeReactColumnDefinition) => (
            <Column
              key={col.field}
              field={col.field}
              header={col.header}
              body={col.body}
              sortable
              className="flexible-column"
              bodyClassName="value-cells"
              headerClassName="custom-title"
            />
          ))}
          <Column header="" body={(rowData) => rowActions(rowData)} frozen alignFrozen="right" />
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
        {activeRow && (
          <MenuList dense sx={{ paddingTop: 0, paddingBottom: 0 }}>
            <MenuItem
              onClick={() => handleDownload(activeRow as ProjectDocument)}
              disabled={
                getDownloadState((activeRow as ProjectDocument).id) === LoadingState.LOADING
              }
            >
              {getDownloadListRow((activeRow as ProjectDocument).id)}
            </MenuItem>
            <MenuItem onClick={() => handlePreviewNewTab(activeRow as ProjectDocument)}>
              <ListItemIcon>
                <OpenInNew fontSize="small" sx={{ color: Theme.PrimaryMain }} />
              </ListItemIcon>
              <ListItemText sx={{ color: Theme.PrimaryMain }}>Preview in new tab</ListItemText>
            </MenuItem>
            {canEditDelete && (
              <>
                <MenuItem onClick={() => setEditDetailsOpen(true)}>
                  <ListItemIcon>
                    <Edit fontSize="small" sx={{ color: Theme.PrimaryMain }} />
                  </ListItemIcon>
                  <ListItemText sx={{ color: Theme.PrimaryMain }}>
                    Edit document details
                  </ListItemText>
                </MenuItem>
                <Divider component="li" />
                <MenuItem onClick={() => setDeleteAlertOpen(true)}>
                  <ListItemIcon>
                    <DeleteOutline fontSize="small" sx={{ color: Theme.SecondaryRed }} />
                  </ListItemIcon>
                  <ListItemText sx={{ color: Theme.SecondaryRed }}>Delete</ListItemText>
                </MenuItem>
              </>
            )}
          </MenuList>
        )}
      </Menu>
    </>
  );
}
export default memo(ProjectDocuments);
