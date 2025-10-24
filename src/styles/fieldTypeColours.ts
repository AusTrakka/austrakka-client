export const FIELD_TYPE_COLORS: { [key: string]: { light: string; dark: string } } = {
  string: {
    dark: '#1E88E5',
    light: '#bee2ffff',
  },
  categorical: {
    dark: '#8E24AA',
    light: '#f7caffff',
  },
  number: {
    dark: '#FBC02D',
    light: '#faf5c9ff',
  },
  double: {
    dark: '#F57C00',
    light: '#f7d6a5ff',
  },
  boolean: {
    dark: '#00796B',
    light: '#a5e1dbff',
  },
  date: {
    dark: '#43A047',
    light: '#bff0c1ff',
  },
  default: {
    dark: '#757575',
    light: '#e2e2e2ff',
  },
} as const;

export type FieldType = keyof typeof FIELD_TYPE_COLORS;
