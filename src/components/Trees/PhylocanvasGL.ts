import { PhylocanvasGL, plugins } from '@phylocanvas/phylocanvas.gl';
import { PhylocanvasProps, PhylocanvasNode } from '../../types/phylocanvas.interface';

export const TreeTypes: Record<string, string> = {
  Circular: 'cr',
  Diagonal: 'dg',
  Hierarchical: 'hr',
  Radial: 'rd',
  Rectangular: 'rc',
};

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

  static getMRCA(leafNodes: PhylocanvasNode[]): PhylocanvasNode | null {
    const leafCount = leafNodes.length;
    if (leafCount === 0) return null;

    if (leafCount === 1) return leafNodes[0].parent || leafNodes[0];

    const visitCounts = new Map<PhylocanvasNode, number>();
    let nodesToCheck = leafNodes.slice();

    while (nodesToCheck.length > 0) {
      const nextNodes: PhylocanvasNode[] = [];

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
