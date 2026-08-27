import type { SvgIconComponent } from '@mui/icons-material';
import { CalendarToday, Numbers, TextFields, ToggleOn } from '@mui/icons-material';
import { Theme } from '../../assets/themes/theme';

export enum FieldTypes {
  STRING = 'string',
  DATE = 'date',
  BOOLEAN = 'boolean',
  NUMBER = 'number',
  DOUBLE = 'double',
}

export const FIELD_TYPE_COLOURS: { [key: string]: string } = {
  string: Theme.SecondaryBlue,
  categorical: Theme.SecondaryPurple,
  number: Theme.SecondaryYellow,
  double: Theme.SecondaryOrange,
  boolean: Theme.SecondaryTeal,
  date: Theme.SecondaryLightGreen,
  default: Theme.PrimaryGrey400,
} as const;

export type FieldType = keyof typeof FIELD_TYPE_COLOURS;

export const FIELD_TYPE_ICONS: Record<FieldTypes, SvgIconComponent> = {
  [FieldTypes.STRING]: TextFields,
  [FieldTypes.DATE]: CalendarToday,
  [FieldTypes.BOOLEAN]: ToggleOn,
  [FieldTypes.NUMBER]: Numbers,
  [FieldTypes.DOUBLE]: Numbers,
};
