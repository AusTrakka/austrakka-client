export const TEST_LOCALE = 'sv-SE';

export const TEST_DATE_TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
} as const;

export const TEST_DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
};

export function parseTestDateTime(dateString: string): Date {
  const [datePart, timePart] = dateString.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

export function parseTestDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatTestDateTime(date: Date, timezone?: string): string {
  const options: Intl.DateTimeFormatOptions = {
    ...TEST_DATE_TIME_FORMAT_OPTIONS,
    timeZone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  return date.toLocaleString(TEST_LOCALE, options);
}

export function formatTestDate(date: Date, timezone?: string): string {
  const options: Intl.DateTimeFormatOptions = {
    ...TEST_DATE_FORMAT_OPTIONS,
    timeZone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  return date.toLocaleString(TEST_LOCALE, options);
}
