import { Theme } from '../../assets/themes/theme';

export const PROJECT_STATUS_TYPE_COLOURS: { [key: string]: string } = {
  Open: Theme.SecondaryLightGreen,
  Closed: Theme.SecondaryRed,
  Default: Theme.PrimaryGrey500,
} as const;

export type ProjectStatusType = keyof typeof PROJECT_STATUS_TYPE_COLOURS;
