import { Theme } from '../assets/themes/theme';
import { SeqUploadRowState } from '../types/sequploadtypes';

export const tableCellStyle = { padding: '0px', paddingLeft: '4px', paddingRight: '4px' };
export const tableFormControlStyle = { minWidth: 200, marginTop: 1, marginBottom: 1 };

export const seqStateStyles: Record<string, object> = {
  [SeqUploadRowState.Waiting]: {
    color: 'black',
    backgroundColor: 'white',
    borderColor: Theme.SecondaryDarkGrey,
    border: '1px solid',
  },
  [SeqUploadRowState.Queued]: {
    color: 'black',
    backgroundColor: Theme.SecondaryLightGrey,
  },
  [SeqUploadRowState.CalculatingHash]: {
    color: 'white',
    backgroundColor: Theme.SecondaryBlue,
  },
  [SeqUploadRowState.Uploading]: {
    color: 'white',
    backgroundColor: Theme.SecondaryBlue,
  },
  [SeqUploadRowState.Complete]: {
    color: 'white',
    backgroundColor: Theme.SecondaryLightGreen,
  },
  [SeqUploadRowState.Incomplete]: {
    color: 'black',
    backgroundColor: Theme.SecondaryYellow,
  },
  [SeqUploadRowState.Skipped]: {
    color: 'black',
    backgroundColor: Theme.SecondaryYellow,
  },
  [SeqUploadRowState.Errored]: {
    color: 'white',
    backgroundColor: Theme.SecondaryRed,
  },
};
