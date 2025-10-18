import { createSampleCSV } from '../../../src/utilities/uploadUtils';
import { SeqType, SeqUploadRow, SeqUploadRowState } from '../../../src/types/sequploadtypes';

describe('createSampleCSV', () => {
  test('should list Seq_IDs if seqUploadRows are provided', () => {
    const seqUploadRows: SeqUploadRow[] = [
      { id: '2', seqId: 'seq1', seqType: SeqType.FastqIllPe, state: SeqUploadRowState.Waiting },
      { id: '1', seqId: 'seq2', seqType: SeqType.FastqIllPe, state: SeqUploadRowState.Waiting },
    ];
    
    const expectedCSV = 'Seq_ID\nseq1\nseq2';
    
    const result = createSampleCSV(seqUploadRows);
    expect(result).toEqual(expectedCSV);
  });
  
  test('should return an empty CSV if no seqUploadRows are provided', () => {
    const seqUploadRows: SeqUploadRow[] = [];
    
    const expectedCSV = 'Seq_ID';
    
    const result = createSampleCSV(seqUploadRows);
    expect(result).toEqual(expectedCSV);
  });
});
