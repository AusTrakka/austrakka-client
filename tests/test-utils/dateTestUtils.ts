export const TEST_LOCALE = 'sv-SE';

export const TEST_DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
} as const;

export function parseTestDate(dateString: string): Date {
  const [datePart, timePart] = dateString.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  return new Date(year, month - 1, day, hour, minute);
}

export function formatTestDate(date: Date): string {
  return date.toLocaleString(TEST_LOCALE, {
    ...TEST_DATE_FORMAT_OPTIONS,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
}
