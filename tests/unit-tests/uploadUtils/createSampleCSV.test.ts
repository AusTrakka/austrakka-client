import { createSampleCSV } from '../../../src/utilities/uploadUtils';
import { SeqType, SeqUploadRow, SeqUploadRowState } from '../../../src/types/sequploadtypes';

describe('createSampleCSV', () => {
  test('should handle multiple project abbrevs', () => {
    const dataOwnerAbbrev = 'dataOwner';
    const shareProjectAbbrevs = ['project1', 'project2'];
    const seqUploadRows: SeqUploadRow[] = [
      { id: '2', seqId: 'seq1', seqType: SeqType.FastqIllPe, state: SeqUploadRowState.Waiting },
      { id: '1', seqId: 'seq2', seqType: SeqType.FastqIllPe, state: SeqUploadRowState.Waiting },
    ];
    
    const expectedCSV = 'Seq_ID,Owner_group,Shared_groups\nseq1,dataOwner-Owner,project1-Group;project2-Group\nseq2,dataOwner-Owner,project1-Group;project2-Group';
    
    const result = createSampleCSV(dataOwnerAbbrev, shareProjectAbbrevs, seqUploadRows);
    expect(result).toEqual(expectedCSV);
  });
  
  test('should return an empty string if no seqUploadRows are provided', () => {
    const dataOwnerAbbrev = 'dataOwner';
    const shareProjectAbbrevs = ['project1', 'project2'];
    const seqUploadRows: SeqUploadRow[] = [];
    
    const expectedCSV = 'Seq_ID,Owner_group,Shared_groups';
    
    const result = createSampleCSV(dataOwnerAbbrev, shareProjectAbbrevs, seqUploadRows);
    expect(result).toEqual(expectedCSV);
  });
  
  test('should handle empty shareProjectAbbrevs', () => {
    const dataOwnerAbbrev = 'dataOwner';
    const shareProjectAbbrevs: string[] = [];
    const seqUploadRows: SeqUploadRow[] = [
      { id: '2', seqId: 'seq1', seqType: SeqType.FastqIllPe, state: SeqUploadRowState.Waiting },
      { id: '1', seqId: 'seq2', seqType: SeqType.FastqIllPe, state: SeqUploadRowState.Waiting },
    ];
    
    const expectedCSV = 'Seq_ID,Owner_group,Shared_groups\nseq1,dataOwner-Owner,\nseq2,dataOwner-Owner,';
    
    const result = createSampleCSV(dataOwnerAbbrev, shareProjectAbbrevs, seqUploadRows);
    expect(result).toEqual(expectedCSV);
  });
  
  test('should handle project and dataOwners with hyphens', () => {
    const dataOwnerAbbrev = 'ORG-1';
    const shareProjectAbbrevs = ['System-PROJ1', 'project2'];
    const seqUploadRows: SeqUploadRow[] = [
      { id: '2', seqId: 'seq1', seqType: SeqType.FastqIllPe, state: SeqUploadRowState.Waiting },
      { id: '1', seqId: 'seq2', seqType: SeqType.FastqIllPe, state: SeqUploadRowState.Waiting },
    ];
    
    const expectedCSV = 'Seq_ID,Owner_group,Shared_groups\nseq1,ORG-1-Owner,System-PROJ1-Group;project2-Group\nseq2,ORG-1-Owner,System-PROJ1-Group;project2-Group';
    
    const result = createSampleCSV(dataOwnerAbbrev, shareProjectAbbrevs, seqUploadRows);
    expect(result).toEqual(expectedCSV);
  });
});
