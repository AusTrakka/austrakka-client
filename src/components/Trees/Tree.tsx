import React, { useRef, useEffect, useState, useImperativeHandle } from 'react';
import { Phylocanvas } from './PhylocanvasGL';
import { PhylocanvasProps, PhylocanvasNode } from '../../types/phylocanvas.interface';

export interface TreeProps extends PhylocanvasProps {
  resizeWidthTo: string | null;
  onSelectedIdsChange: CallableFunction;
  setRowSelection: any;
}

export type TreeExportFuctions = {
  exportNewick(): string;
  exportSVG(): Blob;
  exportPNG(): Blob;
  exportJSON(): string;
  getSelectedLeafIDs(): string[];
  getVisibleLeafIDs(): string[];
  fitInCanvas(): void;
  nodes: { ids: { [key: string]: PhylocanvasNode }, leaves: PhylocanvasNode[]; };
};

const Tree = React.forwardRef(
  ({ resizeWidthTo, onSelectedIdsChange, setRowSelection, ...otherProps }: TreeProps, ref) => {
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
      if (tree.current == null && treeDiv.current !== null) {
        if (resizeWidthTo !== null) {
          handleResize();
        }
        tree.current = new Phylocanvas(treeDiv.current, { ...otherProps });
        tree.current.addClickHandler(() => {
          // save the selectedIds in the state
          const selected = tree.current?.props.selectedIds;
          onSelectedIdsChange(selected);
          const obj:any = {};
          for (const key of selected) {
            obj[key] = true;
          }
          setRowSelection(obj);
        });
      }
      if (resizeWidthTo !== null) {
        window.addEventListener('resize', handleResize);
      }
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, [onSelectedIdsChange, otherProps, resizeWidthTo, setRowSelection, size]);

    useEffect(() => {
      const updatedProps = { ...otherProps, size };
      if (tree.current) {
      // update the props on change
        tree.current.setProps({ ...updatedProps });
      }
    }, [otherProps, size]);

    return <div ref={treeDiv} />;
  },
);

export default Tree;
