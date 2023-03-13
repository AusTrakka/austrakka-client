import React, {createRef, useEffect, useState} from 'react';
import { Card, CardContent, Typography } from "@mui/material";
import styles from './ProjectOverview.module.css'

interface SummaryProps {
  projectDesc: string,
  totalSamples: string,
  lastUpload: string,
  isOverviewLoading: boolean
}

const Summary = (props: SummaryProps) => {
  const { projectDesc, totalSamples, lastUpload, isOverviewLoading } = props;
  return (
    <>
      { isOverviewLoading ? <>Loading project summary...</>:
      <>
        <p className={styles.h1}>Project description</p>
        {projectDesc}
        <br /><br /><br />
        <div>
        <Card className={styles.squareTile}>
          <CardContent>
            <p className={styles.cardCategory}>Samples</p>
            <p className={styles.cardTitle}>Total uploaded samples</p>
            <p className={styles.cardStat}>{totalSamples}</p>
            Last sample upload: {lastUpload}
          </CardContent>
        </Card>
        </div>
      </>
      }
    </>
  )
}
export default Summary;