import { Theme } from '@mui/material/styles';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
export const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export default function getStyles(column: string, selectedColumns: string[], theme: Theme) {
  return {
    fontWeight:
        selectedColumns.indexOf(column) === -1
          ? theme.typography.fontWeightRegular
          : theme.typography.fontWeightMedium,
  };
}
