export const hasNonWhitespace = (str?: string | null): boolean =>
  typeof str === 'string' && str.trim().length > 0;
