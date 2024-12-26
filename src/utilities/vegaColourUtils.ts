export default function getComputedColor(cssVar: string) {
  const rootStyle = getComputedStyle(document.documentElement);
  return rootStyle.getPropertyValue(cssVar).trim() || '#default-color';
}
