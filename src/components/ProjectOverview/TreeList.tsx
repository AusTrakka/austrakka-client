import React, {
  createRef, useEffect, useState, memo,
} from 'react';
import styles from './ProjectOverview.module.css';

interface TreesProps {
  isTreesLoading: boolean
}

function TreeList(props: TreesProps) {
  return (
    <p className={styles.h1}>Trees</p>
  );
}
export default memo(TreeList);
