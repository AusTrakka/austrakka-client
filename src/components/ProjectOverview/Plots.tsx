import React, { memo } from 'react';
import styles from './ProjectOverview.module.css';

interface PlotsProps {
  isPlotsLoading: boolean
}

function Plots(props: PlotsProps) {
  const { isPlotsLoading } = props;

  return (
    <>
      <p className={styles.h1}>Plots</p>
      {isPlotsLoading}
    </>
  );
}
export default memo(Plots);
