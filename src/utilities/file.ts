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

// TODO: need to update this to calculate from a stream.
export async function generateHash(message: string) {
  const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8); // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  // convert bytes to hex string
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
