import React, { memo } from 'react';
import {
  Card, CardContent, Alert, Tooltip, Box,
} from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';
import styles from './ProjectOverview.module.css';

interface SummaryProps {
  projectDesc: string,
  totalSamples: number,
  lastUpload: string,
  isOverviewLoading: boolean,
  isOverviewError: {
    detailsError: boolean,
    detailsErrorMessage: string,
    totalSamplesError: boolean,
    totalSamplesErrorMessage: string,
    latestDateError: boolean,
    latestDateErrorMessage: string,
  }
}

function Summary(props: SummaryProps) {
  const {
    projectDesc, totalSamples, lastUpload, isOverviewError, isOverviewLoading,
  } = props;

  if (isOverviewLoading) return null;

  return (
    <>
      <p className={styles.h1}>Project description</p>
      { isOverviewError.detailsError
        ? <Alert severity="error">{isOverviewError.detailsErrorMessage}</Alert>
        : (
          <p>
            { projectDesc }
          </p>
        )}
      <br />
      <br />
      <br />
      <div>
        <Card className={styles.squareTile}>
          <CardContent>
            <p className={styles.cardCategory}>Samples</p>
            <p className={styles.cardTitle}>Total uploaded samples</p>
            { isOverviewError.totalSamplesError
              ? <Alert severity="error">{isOverviewError.totalSamplesErrorMessage}</Alert>
              : <p className={styles.cardStat}>{totalSamples.toLocaleString('en-US')}</p>}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ paddingRight: 1 }}>
                Last sample upload:
              </Box>
              { isOverviewError.latestDateError ? (
                <Tooltip title={isOverviewError.latestDateErrorMessage}>
                  <ErrorOutline color="error" />
                </Tooltip>
              )
                : <p>{ lastUpload }</p>}
            </Box>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
export default memo(Summary);
