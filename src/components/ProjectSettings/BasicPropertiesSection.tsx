import { CancelOutlined, CheckCircleOutlined } from '@mui/icons-material';
import {
  FormControl,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useApi } from '../../app/ApiContext';
import { Theme } from '../../assets/themes/theme';
import { MergeAlgorithm } from '../../constants/mergeAlgorithm';
import { ResponseType } from '../../constants/responseType';
import type { Project, ProjectPut } from '../../types/dtos';
import { isoDateLocalDate } from '../../utilities/dateUtils';
import { pathchProjectIsActive, putProjectDetails } from '../../utilities/resourceUtils';
import EditButtons from '../Users/EditButtons';
import { FieldLabelWithTooltip } from '../Users/RowRender/FieldLabelWithToolTip';
import { useDraftState } from './useDraftState';

interface BasicPropertiesSectionProps {
  projectAbbrev: string | undefined;
  canonical: Project;
  onSaved: () => Promise<void>;
  onSaveResult: (severity: 'success' | 'error', message: string) => void;
  dashboards: string[];
  editable: boolean;
}

interface EditableFieldInputProps {
  field: keyof ProjectDraft;
  value: any;
  dashboards: string[];
  onChange: (newValue: unknown) => void;
}

const nonDisplayFields: ReadonlyArray<keyof Project> = [
  'projectId',
  'globalId',
  'projectMembers',
  'trees',
  'groupName',
  'clientType',
  'created',
  'createdBy',
  'lastUpdated',
  'lastUpdatedBy',
];

const readonlyFields: ReadonlyArray<keyof Project> = ['abbreviation', 'requestingOrg'];

const desiredOrderingOfEditableFields: ReadonlyArray<keyof ProjectDraft> = [
  'name',
  'description',
  'label',
  'dashboardName',
  'mergeAlgorithm',
  'isActive',
];

const readableNames: Record<string, string> = {
  abbreviation: 'Abbreviation',
  created: 'Created',
  createdBy: 'Created By',
  lastUpdated: 'Last Updated',
  lastUpdatedBy: 'Last Updated By',
  name: 'Name',
  description: 'Description',
  label: 'Label',
  requestingOrg: 'Requesting Organisation',
  dashboardName: 'Dashboard Name',
  mergeAlgorithm: 'Merge Algorithm',
  isActive: 'Active',
};

type ProjectDraft = ProjectPut & { isActive: boolean };
function toProjectDraft(project: Project): ProjectDraft {
  return {
    ...toProjectPut(project),
    isActive: project.isActive,
  };
}

function toProjectPut(project: Project): ProjectPut {
  return {
    name: project.name,
    description: project.description,
    requestingOrg: project.requestingOrg,
    dashboardName: project.dashboardName,
    label: project.label,
    mergeAlgorithm: project.mergeAlgorithm as MergeAlgorithm,
    clientType: project.clientType,
  };
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean')
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Switch checked={value} size="small" disabled />
        <Tooltip title={(value as boolean) ? 'Active' : 'Disabled'} arrow placement="top">
          {(value as boolean) || false ? (
            <CheckCircleOutlined fontSize="small" style={{ color: Theme.SecondaryLightGreen }} />
          ) : (
            <CancelOutlined fontSize="small" style={{ color: Theme.SecondaryOrange }} />
          )}
        </Tooltip>
      </div>
    );
  if (value instanceof Date) return isoDateLocalDate(value.toISOString());
  return String(value);
}

const EditableFieldInput = ({ field, value, onChange, dashboards }: EditableFieldInputProps) => {
  const descriptionMaxLength: number = 500;
  const nameMaxLength: number = 50;
  switch (field) {
    case 'mergeAlgorithm':
      return (
        <FormControl fullWidth size="small" variant="filled" hiddenLabel>
          <Select value={value ?? ''} onChange={(e) => onChange(e.target.value)} displayEmpty>
            <MenuItem value={MergeAlgorithm.OVERRIDE}>Override</MenuItem>
            <MenuItem value={MergeAlgorithm.SHOW_ALL}>Show all</MenuItem>
          </Select>
        </FormControl>
      );

    case 'dashboardName':
      return (
        <FormControl fullWidth size="small" variant="filled" hiddenLabel>
          <Select value={value ?? ''} onChange={(e) => onChange(e.target.value)} displayEmpty>
            {dashboards.map((dashboardName: string) => (
              <MenuItem key={dashboardName} value={dashboardName}>
                {dashboardName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    case 'name':
      return (
        <TextField
          variant="filled"
          size="small"
          fullWidth
          hiddenLabel
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          slotProps={{
            // 1. Native HTML input element properties
            htmlInput: {
              maxLength: nameMaxLength,
            },
            // 2. MUI Input component properties (where endAdornment lives)
            input: {
              style: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                flexWrap: 'nowrap',
              },
              endAdornment: (
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'rgba(0, 0, 0, 0.6)',
                    whiteSpace: 'nowrap',
                    paddingLeft: '8px',
                    flexShrink: 0,
                  }}
                >
                  {`${value?.length ?? 0}/${nameMaxLength}`}
                </span>
              ),
            },
          }}
        />
      );
    case 'description':
      return (
        <TextField
          variant="filled"
          size="small"
          fullWidth
          multiline
          rows={1}
          hiddenLabel
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          sx={{
            '& .MuiInputBase-root': {
              display: 'flex',
              alignItems: 'stretch', // default cross-axis behavior: children fill height
              resize: 'vertical',
              overflow: 'auto',
              minHeight: '45px',
            },
            '& .MuiInputBase-input': {
              resize: 'none',
              flex: 1,
              height: '100% !important',
              boxSizing: 'border-box',
            },
          }}
          slotProps={{
            htmlInput: {
              maxLength: descriptionMaxLength,
            },
            input: {
              endAdornment: (
                <InputAdornment
                  position="end"
                  sx={{
                    alignSelf: 'center', // overrides the root's stretch, just for this child
                    margin: 0,
                    pl: 1,
                    '& .MuiTypography-root': { fontSize: '0.75rem', color: 'text.secondary' },
                  }}
                >
                  {`${value?.length ?? 0}/${descriptionMaxLength}`}
                </InputAdornment>
              ),
            },
          }}
        />
      );

    case 'isActive':
      return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Switch checked={value} size="small" onChange={(e) => onChange(e.target.checked)} />
          <Tooltip title={(value as boolean) ? 'Active' : 'Disabled'} arrow placement="top">
            {(value as boolean) || false ? (
              <CheckCircleOutlined fontSize="small" style={{ color: Theme.SecondaryLightGreen }} />
            ) : (
              <CancelOutlined fontSize="small" style={{ color: Theme.SecondaryOrange }} />
            )}
          </Tooltip>
        </div>
      );

    default:
      return (
        <TextField
          variant="filled"
          size="small"
          fullWidth
          hiddenLabel
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
};

function BasicPropertiesSection(props: BasicPropertiesSectionProps) {
  const { projectAbbrev, canonical, onSaved, dashboards, editable, onSaveResult } = props;
  const { token } = useApi();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const canonicalPut = toProjectDraft(canonical);
  const { draft, setDraft, isDirty, diff } = useDraftState(canonicalPut);

  const handleSave = async () => {
    if (!projectAbbrev) return;
    setIsSaving(true);

    try {
      const { isActive, ...restDiff } = diff;
      const { isActive: _omit, ...putPayload } = draft; // strip isActive out of the PUT body

      const results = await Promise.all([
        Object.keys(restDiff).length > 0
          ? putProjectDetails(projectAbbrev, putPayload, token)
          : Promise.resolve({ status: ResponseType.Success }),
        isActive !== undefined
          ? pathchProjectIsActive(isActive, projectAbbrev, token)
          : Promise.resolve({ status: ResponseType.Success }),
      ]);

      if (results.every((r) => r.status === ResponseType.Success)) {
        await onSaved();
        setIsEditing(false);
        onSaveResult('success', 'Project details updated successfully');
      } else {
        onSaveResult('error', 'Could not save project details');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(canonicalPut);
    setIsEditing(false);
    setSaveError(null);
  };

  if (!canonical) return null;

  return (
    <Paper elevation={1} className="basic-project-info-table">
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        style={{ padding: '10px' }}
      >
        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
          Basic Properties
        </Typography>
        <EditButtons
          editing={isEditing}
          setEditing={setIsEditing}
          onSave={handleSave}
          onCancel={handleCancel}
          hasSavedChanges={isDirty}
          canSee={() => editable} // wire up your permission check here
          onSaveLoading={isSaving}
        />
      </Stack>
      <TableContainer>
        <Table sx={{ borderBottom: 'none' }}>
          <TableBody>
            {readonlyFields.map((field) => (
              <TableRow key={field}>
                <TableCell className="project-key-cell">
                  <FieldLabelWithTooltip field={field} readableNames={readableNames} />
                </TableCell>
                <TableCell className="project-value-cell">
                  {formatValue(canonical[field])}
                </TableCell>
              </TableRow>
            ))}
            {desiredOrderingOfEditableFields.map((field) => (
              <TableRow key={field}>
                <TableCell className={isEditing ? 'project-key-cell-editing' : 'project-key-cell'}>
                  <FieldLabelWithTooltip field={field} readableNames={readableNames} />
                </TableCell>
                <TableCell
                  className={isEditing ? 'project-value-cell-editing' : 'project-value-cell'}
                >
                  {isEditing ? (
                    <EditableFieldInput
                      field={field}
                      value={draft[field]}
                      onChange={(newValue: unknown) => setDraft({ ...draft, [field]: newValue })}
                      dashboards={dashboards}
                    />
                  ) : (
                    formatValue(draft[field])
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default BasicPropertiesSection;
