import React, { memo } from 'react';
import styles from './ProjectOverview.module.css';

interface TreesProps {
  isTreesLoading: boolean
}

function TreeList(props: TreesProps) {
  const { isTreesLoading } = props;
  return (
    <>
      <p className={styles.h1}>Trees</p>
      {isTreesLoading}
    </>
  );
}
export default memo(TreeList);
