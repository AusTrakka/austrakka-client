import React, { useRef, useEffect, useState, useImperativeHandle } from 'react';
import { Phylocanvas } from './PhylocanvasGL';
import { PhylocanvasProps, PhylocanvasNode } from '../../types/phylocanvas.interface';
import { RerootType } from '../../types/tree.interface';

export interface TreeProps extends PhylocanvasProps {
  resizeWidthTo: string | null;
  onSelectedIdsChange: React.Dispatch<React.SetStateAction<string[]>>;
  reroot: RerootType;
}

export type TreeFuctions = {
  exportNewick(): string;
  exportSVG(): Blob;
  exportPNG(): Blob;
  exportJSON(): string;
  getSelectedLeafIDs(): string[];
  getVisibleLeafIDs(): string[];
  fitInCanvas(): void;
  midpointReroot(): void;
  nodes: { ids: { [key: string]: PhylocanvasNode }, leaves: PhylocanvasNode[]; };
};

const Tree = React.forwardRef(
  ({ resizeWidthTo, onSelectedIdsChange, ...otherProps }: TreeProps, ref) => {
    const treeDiv = useRef<HTMLDivElement>(null);
    const tree = useRef<Phylocanvas | null>(null);
    const [size, setSize] = useState<{ width: number; height: number }>(otherProps.size);

    useImperativeHandle(ref, () => ({
      exportNewick() {
        return tree.current?.exportNewick();
      },
      exportSVG() {
        return tree.current?.exportSVG();
      },
      exportPNG() {
        return tree.current?.exportPNG();
      },
      exportJSON() {
        return tree.current?.exportJSON();
      },
      getSelectedLeafIDs() {
        return tree.current?.props.selectedIds || [];
      },
      getVisibleLeafIDs() {
        return tree.current?.getGraphAfterLayout().leaves.map(
          (leaf: PhylocanvasNode) => leaf.id,
        ) || [];
      },
      fitInCanvas() {
        return tree.current?.fitInCanvas();
      },
      midpointReroot() {
        return tree.current?.midpointRoot();
      },
      nodes: tree.current?.getGraphAfterLayout(),
    }));

    useEffect(() => {
      function handleResize() {
        const gridRef = document.querySelector(resizeWidthTo!);
        const width = gridRef?.getBoundingClientRect().width!;
        if (width) {
          setSize({ height: size.height, width: width - 10 });
        }
      }

      // Initialization
      if (tree.current === null && treeDiv.current !== null) {
        if (resizeWidthTo !== null) {
          handleResize();
        }
        tree.current = new Phylocanvas(treeDiv.current, { ...otherProps });
        tree.current.addClickHandler(() => {
          const selected = tree.current?.props.selectedIds;
          onSelectedIdsChange(selected);
        });
      }

      // Resize event listener
      if (resizeWidthTo !== null) {
        window.addEventListener('resize', handleResize);
      }

      // Cleanup on unmount
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, [onSelectedIdsChange, otherProps, resizeWidthTo, size]);

    // Consolidate props update and rerooting
    useEffect(() => {
      const updatedProps = { ...otherProps, size };
      if (tree.current) {
        // Update the props on change
        tree.current.setProps({ ...updatedProps });

        // Reroot if required
        if (otherProps.reroot === 'midpoint') {
          tree.current?.midpointRoot();
        }
      }
    }, [otherProps, size]);

    return <div ref={treeDiv} />;
  },
);

export default Tree;
