interface MetadataValue {
  colour: string;
  label: string;
}

export interface PhylocanvasMetadata {
  // seqId: -------> columnName: {colour: rbg, label: value}
  [key: string]: { [key: string]: MetadataValue };
}

export interface PhylocanvasLegends {
  [key: string]: { [colour: string]: string }
}

export interface PhylocanvasNode {
  id: string;
  isLeaf: boolean;
  children: PhylocanvasNode[];
  parent: PhylocanvasNode | null;
  [key: string]: any;
}

interface Size {
  width: number;
  height: number;
}

export interface PhylocanvasProps {
  source: string;
  size: Size;
  showLabels: boolean;
  showLeafLabels: boolean;
  interactive: boolean;
  metadata: PhylocanvasMetadata;
  blocks: string[];
  nodeColumns: string;
  alignLabels: boolean;
  showBlockHeaders: boolean;
  nodeSize: number;
  backgroundColour?: null | string;
  blockHeaderFontSize?: number;
  blockPadding?: number;
  blockSize?: number;
  branchLengthsDigits?: number;
  branchLengthsFormat?: null | string;
  branchZoom?: number;
  centre?: [number, number];
  collapsedIds?: any[]; // Replace any[] with the actual type if known
  edgeOverlapFactor?: number;
  fillColour?: string;
  fontColour?: [number, number, number, number];
  fontFamily?: string;
  fontSize?: number;
  haloRadius?: number;
  haloWidth?: number;
  highlightColour?: [number, number, number, number];
  minScale?: number;
  nodeOverlapFactor?: number;
  nodeShape?: string;
  padding?: number;
  rootId?: null | string;
  rotatedIds?: any[]; // Replace any[] with the actual type if known
  scaleLineAlpha?: boolean;
  selectedIds?: string[];
  shapeBorderAlpha?: number;
  shapeBorderWidth?: number;
  showBlockLabels?: boolean;
  showBranchLengths?: boolean;
  showEdges?: boolean;
  showInternalLabels?: boolean;
  showPiecharts?: boolean;
  showShapeBorders?: boolean;
  showShapes?: boolean;
  stepZoom?: number;
  strokeColour?: [number, number, number, number];
  strokeWidth?: number;
  styleLeafLabels?: boolean;
  styleNodeEdges?: boolean;
  styles?: Record<string, any>; // An object containing node styles keyed by leaf labels.
  treeToCanvasRatio?: number;
  type?: string;
  zoom?: number;
}
