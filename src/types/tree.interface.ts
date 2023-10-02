export default interface TreeState {
  // state for phylocanvas
  blocks: any[];
  nodeColumn: string;
  alignLabels: boolean;
  showBlockHeaders: boolean;
  blockHeaderFontSize: number;
  blockPadding: number;
  blockSize: number;
  showLeafLabels: boolean;
  fontSize: number;
  nodeSize: number;
  fillColour: string,
  type: string; // replace with the correct type of TreeTypes
  showInternalLabels: boolean;
  showBranchLengths: boolean;
  // extra state for the tree controls
  labelBlocks: string[];
  keyValueLabelBlocks: boolean;
}
