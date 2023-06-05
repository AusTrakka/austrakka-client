import { PhylocanvasGL, plugins } from '@phylocanvas/phylocanvas.gl';

export interface PhylocanvasProps {
  source: string;
  size: { width: number; height: number };
  showLabels: boolean;
  showLeafLabels: boolean;
  interactive: boolean;
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
