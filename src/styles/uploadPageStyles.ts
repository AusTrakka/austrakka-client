import { SeqUploadRowState } from '../types/sequploadtypes';

export const tableCellStyle = { padding: '0px', paddingLeft: '4px', paddingRight: '4px' };
export const tableFormControlStyle = { minWidth: 200, marginTop: 1, marginBottom: 1 };

export const seqStateStyles: Record<string, object> = {
  [SeqUploadRowState.Waiting]: {
    color: 'black',
    backgroundColor: 'white',
    borderColor: import.meta.env.VITE_THEME_SECONDARY_DARK_GREY,
    border: '1px solid',
  },
  [SeqUploadRowState.Queued]: {
    color: 'black',
    backgroundColor: import.meta.env.VITE_THEME_SECONDARY_LIGHT_GREY,
  },
  [SeqUploadRowState.CalculatingHash]: {
    color: 'white',
    backgroundColor: import.meta.env.VITE_THEME_SECONDARY_BLUE,
  },
  [SeqUploadRowState.CalculatedHash]: {
    color: 'white',
    backgroundColor: import.meta.env.VITE_THEME_SECONDARY_BLUE,
  },
  [SeqUploadRowState.Uploading]: {
    color: 'white',
    backgroundColor: import.meta.env.VITE_THEME_SECONDARY_BLUE,
  },
  [SeqUploadRowState.Complete]: {
    color: 'white',
    backgroundColor: import.meta.env.VITE_THEME_SECONDARY_LIGHT_GREEN,
  },
  [SeqUploadRowState.Incomplete]: {
    color: 'black',
    backgroundColor: import.meta.env.VITE_THEME_SECONDARY_YELLOW,
  },
  [SeqUploadRowState.Errored]: {
    color: 'white',
    backgroundColor: import.meta.env.VITE_THEME_SECONDARY_RED,
  },
};
