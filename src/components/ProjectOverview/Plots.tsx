import React, {createRef, useEffect, useState} from 'react';
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
export default Plots;