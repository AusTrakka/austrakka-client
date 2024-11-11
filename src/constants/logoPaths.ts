export const logoUrl = new URL(`/src/assets/logos/${import.meta.env.VITE_LOGO_PATH}`, import.meta.url).href;
export const logoOnlyUrl = new URL(`/src/assets/logos/${import.meta.env.VITE_LOGO_SMALL_PATH}`, import.meta.url).href;
