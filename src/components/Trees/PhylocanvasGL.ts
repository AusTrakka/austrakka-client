import { PhylocanvasGL, plugins, TreeTypes } from '@phylocanvas/phylocanvas.gl';

type MetadataValue = { 'colour': string, 'label': string };
export type TreeMetadata = Record<string, Record<string, MetadataValue>>;

interface Size {
  width: number;
  height: number;
}

type TreeType = typeof TreeTypes[keyof typeof TreeTypes];

export interface PhylocanvasProps {
  source: string;
  size: Size;
  showLabels: boolean;
  showLeafLabels: boolean;
  interactive: boolean;
  metadata: TreeMetadata;
  blocks: string[];
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
  fillColour?: [number, number, number, number];
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
  selectedIds?: any[]; // Replace any[] with the actual type if known
  shapeBorderAlpha?: number;
  shapeBorderWidth?: number;
  // showBlockLabels?: boolean;
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
  type?: TreeType;
  zoom?: number;
}

export class Phylocanvas extends PhylocanvasGL {
  constructor(view: HTMLDivElement, props: PhylocanvasProps) {
    super(
      view,
      props,
      [plugins.scalebar],
    );
    this.clickHandlers = [];
    this.view.style.backgroundImage = ''; // remove logo
  }

  addClickHandler(fn: Function) {
    this.clickHandlers.push(fn);
  }

  handleClick(info: any, event: any) {
    super.handleClick(info, event);
    this.clickHandlers.forEach((fn: Function) => fn(info, event));
  }
  // add additional methods here...
}
