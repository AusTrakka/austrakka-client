export function isoDateLocalDate(datetime: any) {
  const isoDate = new Date(datetime.getValue());
  const localDate = isoDate.toLocaleDateString();
  return localDate;
}
