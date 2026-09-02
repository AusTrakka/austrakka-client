import { type AlertColor, Box, Paper, Stack, Typography } from '@mui/material';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import {
  DataTable,
  type DataTableFilterMeta,
  type DataTableFilterMetaData,
} from 'primereact/datatable';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApi } from '../../app/ApiContext';
import { ResponseType } from '../../constants/responseType';
import type { Organisation, ProjectOrganisationsPatch } from '../../types/dtos';
import {
  addProjectOrganisations,
  getOrganisations,
  getProjectOrganisations,
  removeProjectOrganisations,
} from '../../utilities/resourceUtils';
import SearchInput from '../TableComponents/SearchInput';
import sortIcon from '../TableComponents/SortIcon';
import EditButtons from '../Users/EditButtons';

interface ParticipatingOrgsPropertiesSection {
  projectAbbrev: string | undefined;
  editable: boolean;
  onSaveResult: (severity: AlertColor, message: string) => void;
}

const columns = [
  { field: 'abbreviation', header: 'Abbrev' },
  { field: 'name', header: 'Name' },
];

export default function ParticipatingOrgsPropertiesSection({
  projectAbbrev,
  editable,
  onSaveResult,
}: ParticipatingOrgsPropertiesSection): React.JSX.Element {
  const { token } = useApi();

  const [isEditing, setIsEditing] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [filter, setFilter] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [projectOrgs, setProjectOrgs] = useState<Organisation[]>([]);
  const [pendingOrgs, setPendingOrgs] = useState<Organisation[]>([]);

  const orgsToAdd = useMemo(() => {
    return pendingOrgs.filter((o) => !projectOrgs.find((p) => p.abbreviation === o.abbreviation));
  }, [pendingOrgs, projectOrgs]);

  const orgsToRemove = useMemo(() => {
    return projectOrgs.filter((o) => !pendingOrgs.find((p) => p.abbreviation === o.abbreviation));
  }, [pendingOrgs, projectOrgs]);

  const hasPendingChanges = orgsToAdd.length > 0 || orgsToRemove.length > 0;

  const startEditing = useCallback(() => {
    setPendingOrgs(projectOrgs);
    setIsEditing(true);
  }, [projectOrgs]);

  const fetchProjectOrganisations = useCallback(async () => {
    if (!projectAbbrev) return;

    const projOrgRes = await getProjectOrganisations(projectAbbrev, token);

    if (projOrgRes.type === ResponseType.Error) {
      setProjectOrgs([]);
      setIsError(true);
      setIsLoading(false);
      setErrorMessage(projOrgRes.message);
      return;
    }

    if (projOrgRes.data) {
      projOrgRes.data.sort((a, b) => a.abbreviation.localeCompare(b.abbreviation));
    }

    setProjectOrgs(projOrgRes.data || []);
    setIsLoading(false);
    setIsError(false);
  }, [token, projectAbbrev]);

  const fetchOrganisations = useCallback(async () => {
    const orgRes = await getOrganisations(false, token);

    if (orgRes.type === ResponseType.Error) {
      setOrgs([]);
      setIsError(true);
      setIsLoading(false);
      setErrorMessage(orgRes.message);
      return;
    }

    setOrgs(orgRes.data || []);
    setIsLoading(false);
    setIsError(false);
  }, [token]);

  useEffect(() => {
    void fetchOrganisations();
  }, [fetchOrganisations]);

  useEffect(() => {
    void fetchProjectOrganisations();
  }, [fetchProjectOrganisations]);

  const handleSave = async () => {
    if (!projectAbbrev) return;
    setIsSaving(true);

    if (orgsToRemove.length > 0) {
      const rmPatch: ProjectOrganisationsPatch = {
        organisationNames: orgsToRemove.map((o) => o.abbreviation),
      };
      const rmRes = await removeProjectOrganisations(projectAbbrev, rmPatch, token);
      if (rmRes.type === ResponseType.Error) {
        setIsSaving(false);
        onSaveResult('error', rmRes.message ?? 'Could not remove organisations');
        return;
      }
    }

    if (orgsToAdd.length > 0) {
      const addPatch: ProjectOrganisationsPatch = {
        organisationNames: orgsToAdd.map((o) => o.abbreviation),
      };
      const addRes = await addProjectOrganisations(projectAbbrev, addPatch, token);
      if (addRes.type === ResponseType.Error) {
        setIsSaving(false);
        onSaveResult('error', addRes.message ?? 'Could not add organisations');
        return;
      }
    }

    await fetchProjectOrganisations();
    setPendingOrgs([]);
    setIsEditing(false);
    setIsSaving(false);
    onSaveResult('success', 'Participating organisations updated');
  };

  const handleCancel = () => {
    setPendingOrgs([]);
    setIsEditing(false);
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const filters = { ...filter };
    (filters.global as DataTableFilterMetaData).value = value;
    setFilter(filters);
  };

  const header = () => (
    <Stack direction="row" alignItems="center" gap={1} style={{ width: '100%' }}>
      <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
        Participating Organisations
      </Typography>
      <Box>
        <SearchInput
          value={(filter.global as DataTableFilterMetaData).value || ''}
          forceExpanded
          iconSx={{ fontSize: '2rem' }}
          onChange={onGlobalFilterChange}
        />
      </Box>
      <Box sx={{ marginLeft: 'auto' }}>
        <EditButtons
          editing={isEditing}
          setEditing={startEditing}
          onSave={handleSave}
          onCancel={handleCancel}
          hasPendingChanges={hasPendingChanges}
          canSee={() => editable}
          onSaveLoading={isSaving}
        />
      </Box>
    </Stack>
  );

  return (
    <Paper
      elevation={1}
      sx={{
        maxWidth: '900px',
        padding: '10px 20px 20px 20px',
        height: '450px',
        display: 'flex',
        flexDirection: 'column',
        '& .p-datatable-header': {
          border: 'none',
          borderBottom: 'none',
          padding: 0,
        },
      }}
    >
      {isLoading ? (
        <Typography variant="body1" color="primary">
          Loading participating organisations
        </Typography>
      ) : (
        <Box style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {isError ? (
            <Typography variant="body1" color="error">
              {errorMessage}
            </Typography>
          ) : (
            <DataTable
              value={isEditing ? orgs : projectOrgs}
              dataKey="abbreviation"
              selectionMode="checkbox"
              selection={isEditing ? pendingOrgs : []}
              onSelectionChange={(e) => {
                if (isEditing) {
                  setPendingOrgs(e.value as Organisation[]);
                }
              }}
              resizableColumns
              scrollable
              filters={filter}
              header={header}
              globalFilterFields={columns.map((col) => col.field)}
              size="small"
              scrollHeight="flex"
              columnResizeMode="expand"
              removableSort
              className="project-orgs-table"
              sortIcon={sortIcon}
              style={{ flex: 1, minHeight: 0, padding: '0.5rem' }}
            >
              {isEditing && (
                <Column
                  selectionMode="multiple"
                  headerStyle={{ width: '3rem' }}
                  style={{ width: '3rem' }}
                />
              )}
              {columns.map((col) => (
                <Column
                  key={col.field}
                  field={col.field}
                  header={col.header}
                  resizeable
                  style={{ minWidth: '150px' }}
                  headerClassName="custom-title"
                  className="flexible-column"
                />
              ))}
            </DataTable>
          )}
        </Box>
      )}
    </Paper>
  );
}
