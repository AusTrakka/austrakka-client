export default interface TreeState {
  // state for phylocanvas
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
  // extra state for the tree controls
  labelBlocks: string[];
}
