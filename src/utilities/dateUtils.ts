export function isoDateLocalDate(datetime: string): string {
  if (!datetime) return '';
  if (datetime === 'null') return '';
  const isoDate = new Date(Date.parse(datetime));
  return isoDate.toLocaleString('sv-SE', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
}

export function isoDateLocalDateNoTime(datetime: string) {
  if (!datetime) return '';
  if (datetime === 'null') return '';
  const isoDate = new Date(Date.parse(datetime));
  return isoDate.toLocaleString('sv-SE', { year: 'numeric', month: 'numeric', day: 'numeric' });
}

export function formatDate(dateUTC: string): string {
  if (!dateUTC) return '';
  if (dateUTC === 'null') return '';
  if (Number.isNaN(Date.parse(dateUTC))) return 'Invalid Date';
  const date = new Date(dateUTC);
  return date.toLocaleString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: 'numeric', timeZoneName: 'short' });
}

export function isISODateString(value: string) {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})?$/;

  if (isoDateRegex.test(value)) {
    const parsedDate = new Date(value);
    return !Number.isNaN(parsedDate.getTime()); // Valid date check
  }
  return false;
}
