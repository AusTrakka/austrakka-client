import { CancelOutlined, CheckCircleOutlined } from '@mui/icons-material';
import { FormControl, MenuItem, Select, Switch, TextField, Tooltip } from '@mui/material';
import { Theme } from '../../assets/themes/theme';
import { MergeAlgorithm } from '../../constants/mergeAlgorithm';
import { CharCountedTextField } from '../Common/SettingsPage/CharCountTextField';
import type { ProjectDraft } from './projectMeta';

const NAME_MAX_LENGTH = 50;
const DESCRIPTION_MAX_LENGTH = 500;

interface EditableFieldInputProps {
  field: keyof ProjectDraft;
  value: any;
  dashboards: string[];
  onChange: (newValue: unknown) => void;
  organisations: { name: string; abbrev: string }[];
}

export const EditableFieldInput = ({
  field,
  value,
  onChange,
  dashboards,
  organisations,
}: EditableFieldInputProps) => {
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
    case 'requestingOrg':
      return (
        <FormControl fullWidth size="small" variant="filled" hiddenLabel>
          <Select value={value ?? ''} onChange={(e) => onChange(e.target.value)} displayEmpty>
            {organisations.map((org: { name: string; abbrev: string }) => (
              <MenuItem key={org.abbrev} value={org.abbrev}>
                {`${org.name} (${org.abbrev})`}
              </MenuItem>
            ))}
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
      return <CharCountedTextField value={value} maxLength={NAME_MAX_LENGTH} onChange={onChange} />;
    case 'description':
      return (
        <CharCountedTextField
          value={value}
          maxLength={DESCRIPTION_MAX_LENGTH}
          multiline
          onChange={onChange}
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
