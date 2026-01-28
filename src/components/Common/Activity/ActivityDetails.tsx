import React from 'react';
import { Box, Typography } from '@mui/material';
import { EventNote } from '@mui/icons-material';
import ActivityContentBox from './ActivityContentBox';
import { ActivityDetailInfo } from './activityViewModels.interface';
import { formatDate } from '../../../utilities/dateUtils';
import CustomDrawer from '../CustomDrawer';

interface ActivityDetailProps {
  drawerOpen: boolean,
  setDrawerOpen: (open: boolean) => void,
  detailInfo: ActivityDetailInfo,
}

function ActivityDetails(props: ActivityDetailProps): JSX.Element {
  const { drawerOpen, setDrawerOpen, detailInfo } = props;
  const friendlyEventDate = formatDate(detailInfo['Time stamp']);
    
  return (
    <CustomDrawer drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen}>
      <Box>
        <EventNote fontSize="large" color="primary" />
        <Typography variant="h4" color="primary">
          {detailInfo.Event}
        </Typography>
        <Typography variant="subtitle2">
          {friendlyEventDate}
        </Typography>
        <ActivityContentBox entry={detailInfo} />
      </Box>
    </CustomDrawer>
  );
}

export default ActivityDetails;
