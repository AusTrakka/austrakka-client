import * as React from 'react';
import {memo} from 'react';
import styles from './ProjectOverview.module.css'

interface PlotsProps {
  isPlotsLoading: boolean
}

const Plots = (props: PlotsProps) => {
  
  return (
    <>
        <p className={styles.h1}>Plots</p>
    </>
  )
}
export default memo(Plots);