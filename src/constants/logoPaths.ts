const modules = import.meta.glob('/src/assets/logos/**/*', {
  eager: true,
  query: '?url',
  import: 'default',
});

function getLogoUrl(path: string): string {
  const key = `/src/assets/logos/${path}`;
  const url = modules[key];
  if (!url) throw new Error(`Logo not found: ${key}`);
  return url as string;
}

export const logoUrl = getLogoUrl(import.meta.env.VITE_LOGO_PATH);
export const logoOnlyUrl = getLogoUrl(import.meta.env.VITE_LOGO_SMALL_PATH);
