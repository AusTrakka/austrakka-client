import {memo} from 'react';
import { Card, CardContent, Alert, AlertTitle } from "@mui/material";
import styles from './ProjectOverview.module.css'

interface SummaryProps {
  projectDesc: string,
  totalSamples: number,
  lastUpload: string,
  isOverviewLoading: boolean,
  isOverviewError: boolean
}

const Summary = (props: SummaryProps) => {
  const { projectDesc, totalSamples, lastUpload, isOverviewError } = props;
  return (
    <>
        { isOverviewError ? 
          <Alert severity="error">
            <AlertTitle>Error</AlertTitle>
            There has been an error loading your project summary, please try again later.
          </Alert>
          :
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
export default memo(Summary);