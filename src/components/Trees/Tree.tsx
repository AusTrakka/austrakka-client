import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { PhylocanvasNode, PhylocanvasProps } from '../../types/phylocanvas.interface';
import { Phylocanvas } from './PhylocanvasGL';

export const DEFAULT_INIT_TREE_HEIGHT = 600;
export const DEFAULT_INIT_TREE_WIDTH = 600;

export interface TreeProps extends PhylocanvasProps {
  resizeRef?: React.RefObject<HTMLElement>;
  onSelectedIdsChange: React.Dispatch<React.SetStateAction<string[]>>;
}

export type TreeExportFunctions = {
  exportNewick(): string;
  exportSVG(): Blob;
  exportPNG(): string;
  exportJSON(): string;
  getSelectedLeafIDs(): string[];
  getVisibleLeafIDs(): string[];
  fitInCanvas(): void;
  nodes: { ids: { [key: string]: PhylocanvasNode }; leaves: PhylocanvasNode[] };
};

const Tree = React.forwardRef(
  ({ resizeRef, onSelectedIdsChange, ...otherProps }: TreeProps, ref) => {
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
        return (
          tree.current?.getGraphAfterLayout().leaves.map((leaf: PhylocanvasNode) => leaf.id) || []
        );
      },
      fitInCanvas() {
        return tree.current?.fitInCanvas();
      },
      nodes: tree.current?.getGraphAfterLayout(),
    }));

    useEffect(() => {
      if (!resizeRef) return;

      const el = resizeRef.current;
      if (!el) return;

      const observer = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        setSize({
          height: height,
          width: width,
        });
      });

      observer.observe(el);

      return () => observer.disconnect();
    }, [resizeRef]);

    useEffect(() => {
      if (tree.current == null && treeDiv.current !== null) {
        tree.current = new Phylocanvas(treeDiv.current, { ...otherProps });
        tree.current.addClickHandler(() => {
          // save the selectedIds in the state
          const selected = tree.current?.props.selectedIds;
          onSelectedIdsChange(selected);
        });
      }
      // biome-ignore lint/correctness/useExhaustiveDependencies: historic otherProps used
    }, [onSelectedIdsChange, otherProps]);

    useEffect(() => {
      const updatedProps = { ...otherProps, size };
      if (tree.current) {
        // update the props on change
        tree.current.setProps({ ...updatedProps });
      }
      // biome-ignore lint/correctness/useExhaustiveDependencies: historic otherProps used
    }, [otherProps, size]);

    return <div ref={treeDiv} />;
  },
);

export default Tree;
