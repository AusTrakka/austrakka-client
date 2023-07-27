export default interface TreeState {
  blocks: any[];
  alignLabels: boolean;
  showBlockHeaders: boolean;
  blockHeaderFontSize: number;
  blockPadding: number;
  blockSize: number;
  showLeafLabels: boolean;
  fontSize: number;
  nodeSize: number;
  type: string; // replace with the correct type of TreeTypes
  showInternalLabels: boolean;
  showBranchLengths: boolean;
}
