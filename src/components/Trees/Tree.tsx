import React, { useRef, useEffect, useState } from 'react';
import { Phylocanvas, PhylocanvasProps } from './PhylocanvasGL';

export interface TreeProps extends PhylocanvasProps {
  resizeWidthTo: string | null;
  size: { width: number; height: number };
}

function Tree({ resizeWidthTo, ...otherProps }: TreeProps) {
  const treeDiv = useRef<HTMLDivElement>(null);
  const tree = useRef<any | null>(null);
  const [size, setSize] = useState<{ width: number; height: number }>(otherProps.size);

  useEffect(() => {
    function handleResize() {
      const gridRef = document.querySelector(resizeWidthTo!);
      const width = gridRef?.getBoundingClientRect().width!;
      if (width) {
        setSize({ height: size.height, width: width - 40 });
      }
    }
    if (tree.current == null && treeDiv.current !== null) {
      if (resizeWidthTo !== null) {
        handleResize();
      }
      tree.current = new Phylocanvas(treeDiv.current, { ...otherProps });
    }
    if (resizeWidthTo !== null) {
      window.addEventListener('resize', handleResize);
    }
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [otherProps, resizeWidthTo, size]);

  useEffect(() => {
    const updatedProps = { ...otherProps, size };
    if (tree.current) {
      // update the props on change
      tree.current.setProps({ ...updatedProps });
    }
  }, [otherProps, size]);

  return <div ref={treeDiv} />;
}

export default Tree;
