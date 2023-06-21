import { PhylocanvasGL, plugins } from '@phylocanvas/phylocanvas.gl';

type MetadataValue = { 'colour': string, 'label': string };
export type TreeMetadata = Record<string, Record<string, MetadataValue>>;

interface Size {
  width: number;
  height: number;
}

export const TreeTypes: Record<string, string> = {
  Circular: 'cr',
  Diagonal: 'dg',
  Hierarchical: 'hr',
  Radial: 'rd',
  Rectangular: 'rc',
};

export type TreeType = typeof TreeTypes[keyof typeof TreeTypes];

export interface Node {
  id: string;
  isLeaf: boolean;
  children: Node[];
  parent: Node | null;
  [key: string]: any;
}

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

    this.addClickHandler((info: any, event: any) => {
      // select clade
      const node = this.pickNodeFromLayer(info);
      this.selectLeavesFromInternalNode(
        node,
        event.srcEvent.metaKey || event.srcEvent.ctrlKey,
      );
    });
  }

  addClickHandler(fn: Function) {
    this.clickHandlers.push(fn);
  }

  handleClick(info: any, event: any) {
    super.handleClick(info, event);
    this.clickHandlers.forEach((fn: Function) => fn(info, event));
  }

  static getLeafNodeIds(node: any) {
    // depth first search
    const ids: Array<string> = [];
    const traverse = (n: any) => {
      if (!n.isLeaf) {
        for (let i = 0; i < n.children.length; i += 1) {
          traverse(n.children[i]);
        }
      } else {
        ids.push(n.id);
      }
    };
    traverse(node);
    return ids;
  }

  static getMRCA(leafNodes: Node[]): Node | null {
    const leafCount = leafNodes.length;
    if (leafCount === 0) return null;

    if (leafCount === 1) return leafNodes[0].parent || leafNodes[0];

    const visitCounts = new Map<Node, number>();
    let nodesToCheck = leafNodes.slice();

    while (nodesToCheck.length > 0) {
      const nextNodes: Node[] = [];

      for (const node of nodesToCheck) {
        const count = (visitCounts.get(node) || 0) + 1;
        if (count === leafCount) {
          // This is the MRCA.
          return node;
        }

        visitCounts.set(node, count);
        if (node.parent) {
          nextNodes.push(node.parent);
        }
      }

      nodesToCheck = nextNodes;
    }

    return null; // return null if no common ancestor is found
  }

  selectLeavesFromInternalNode(node: any, append = false) {
    if (node && !node.isLeaf) {
      const ids = Phylocanvas.getLeafNodeIds(node);
      this.selectLeafNodes(ids, append);
    }
  }
  // add additional methods here...
}
