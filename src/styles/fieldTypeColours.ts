export const FIELD_TYPE_COLOURS: { [key: string]: string } = {
  string: 'var(--secondary-blue)',
  categorical: 'var(--secondary-purple)',
  number: 'var(--secondary-yellow)',
  double: 'var(--secondary-orange)',
  boolean: 'var(--secondary-teal)',
  date: 'var(--secondary-light-green)',
  default: 'var(--secondary-light-grey)',
} as const;

export type FieldType = keyof typeof FIELD_TYPE_COLOURS;
