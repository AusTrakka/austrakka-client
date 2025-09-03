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

/**
 * This will return Date string with no time in the UTC timezone
 * @param datetime 
 */
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

export function formatDateAsTwoStrings(dateUTC: string): string[] {
  if (!dateUTC) return ['', ''];
  if (dateUTC === 'null') return ['', ''];
  if (Number.isNaN(Date.parse(dateUTC))) return ['Invalid Date', ''];
  const date = new Date(dateUTC);
  const dateString = date.toLocaleString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const timeString = date.toLocaleString('en-AU', { hour: 'numeric', minute: 'numeric', timeZoneName: 'short' });
  return [dateString, timeString];
}

export function formatDateAsTwoIsoStrings(dateUTC: string): string[] {
  if (!dateUTC) return ['', ''];
  if (dateUTC === 'null') return ['', ''];
  if (Number.isNaN(Date.parse(dateUTC))) return ['Invalid Date', ''];
  const isoDate = new Date(Date.parse(dateUTC));
  const dateString = isoDate.toLocaleString('sv-SE', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const timeString = isoDate.toLocaleString('sv-SE', {
    hour: 'numeric',
    minute: 'numeric',
  });
  return [dateString, timeString];
}

export function isISODateString(value: string) {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})?$/;

  if (isoDateRegex.test(value)) {
    const parsedDate = new Date(value);
    return !Number.isNaN(parsedDate.getTime()); // Valid date check
  }
  return false;
}

export function isoDateOrNotRecorded(datetime: string): string {
  if (!datetime || datetime === 'null') return '';

  const date = new Date(datetime);
  const minDate = new Date('0001-01-01T00:00:00Z');

  if (date.getTime() === minDate.getTime()) {
    return 'Not Recorded';
  }

  return isoDateLocalDate(datetime);
}
