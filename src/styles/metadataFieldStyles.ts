// Style rules:
// Maps key word to style class defined in App.css
export const styleRules: Record<string, string> = {
  italic: 'italic-md',
};

// Metadata column style map:
// Map specific metadata field names to style rules
export const columnStyleRules: Record<string, string> = {
  'Species': styleRules.italic,
};

export function combineClasses(...classes: (string | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
