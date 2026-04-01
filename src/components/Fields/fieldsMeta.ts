import { Theme } from '../../assets/themes/theme';

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
