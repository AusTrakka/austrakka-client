import { CancelOutlined, CheckCircleOutlined } from '@mui/icons-material';
import {
  type AlertColor,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useApi } from '../../app/ApiContext';
import { Theme } from '../../assets/themes/theme';
import { ResponseType } from '../../constants/responseType';
import type { Project } from '../../types/dtos';
import { isoDateLocalDate } from '../../utilities/dateUtils';
import { pathchProjectIsActive, putProjectDetails } from '../../utilities/resourceUtils';
import { FieldLabelWithTooltip } from '../Common/SettingsPage/FieldLabelWithToolTip';
import EditButtons from '../Users/EditButtons';
import { EditableFieldInput } from './EditableFieldInput';
import {
  desiredOrderingOfEditableFields,
  readableNames,
  readonlyFields,
  toProjectDraft,
} from './projectMeta';
import { useDraftState } from './useDraftState';

interface BasicPropertiesSectionProps {
  projectAbbrev: string | undefined;
  canonical: Project;
  onSaved: () => Promise<void>;
  onSaveResult: (severity: AlertColor, message: string) => void;
  dashboards: string[];
  editable: boolean;
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
      const { isActive: _omit, ...putPayload } = draft;

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
        onSaveResult(
          'error',
          'Could not update project details. Please check network connection or contact an admin.',
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(canonicalPut);
    setIsEditing(false);
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
          canSee={() => editable}
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
