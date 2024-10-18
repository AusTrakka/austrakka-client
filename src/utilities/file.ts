export function generateFilename(name: string = ''): string {
  if (name !== '') {
    name = `_${name}`;
  }
  const dateObject = new Date();
  const year = dateObject.toLocaleString('default', { year: 'numeric' });
  const month = dateObject.toLocaleString('default', { month: '2-digit' });
  const day = dateObject.toLocaleString('default', { day: '2-digit' });
  const h = dateObject.getHours();
  const m = dateObject.getMinutes();
  const s = dateObject.getSeconds();
  return `${import.meta.env.VITE_BRANDING_NAME.toLowerCase()}${name}_export_${year}${month}${day}_${h}${m}${s}`;
}
