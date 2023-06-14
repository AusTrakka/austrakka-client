import { PhylocanvasGL, plugins } from '@phylocanvas/phylocanvas.gl';

type MetadataValue = { 'colour': string, 'label': string };
export type TreeMetadata = Record<string, Record<string, MetadataValue>>;

export interface PhylocanvasProps {
  source: string;
  size: { width: number; height: number };
  showLabels: boolean;
  showLeafLabels: boolean;
  interactive: boolean;
  metadata: TreeMetadata;
  blocks: string[];
  alignLabels: boolean;
  showBlockHeaders: boolean;
  nodeSize: number;
}

export class Phylocanvas extends PhylocanvasGL {
  constructor(view: HTMLDivElement, props: PhylocanvasProps) {
    super(
      view,
      props,
      [plugins.scalebar],
    );
    this.view.style.backgroundImage = ''; // remove logo
  }
  // add additional methods here...
}
