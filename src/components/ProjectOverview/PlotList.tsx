import React, { memo } from 'react';
import styles from './ProjectOverview.module.css';

interface PlotListProps {
  isPlotsLoading: boolean
}

function PlotList(props: PlotListProps) {
  const { isPlotsLoading } = props;

  return (
    <>
      <p className={styles.h1}>Plots</p>
      {isPlotsLoading}
    </>
  );
}
export default memo(PlotList);
