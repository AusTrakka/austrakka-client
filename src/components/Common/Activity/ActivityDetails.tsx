import { EventNote } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { formatDate } from '../../../utilities/dateUtils';
import CustomDrawer from '../CustomDrawer';
import ActivityContentBox from './ActivityContentBox';
import type { ActivityDetailInfo, VisChainEntry } from './activityViewModels.interface';

interface ActivityDetailProps {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  detailInfo: ActivityDetailInfo;
  recordType: string;
}

function ActivityDetails(props: ActivityDetailProps): JSX.Element {
  const { drawerOpen, setDrawerOpen, detailInfo, recordType } = props;
  const friendlyEventDate = formatDate(detailInfo['Time stamp']);
  const [logContext, setLogContext] = useState<VisChainEntry[]>([]);

  useEffect(() => {
    const contextEntries = (detailInfo.Context || [])
      .filter((chain) => chain.ResourceType !== 'System')
      .filter((chain) => chain.ResourceType !== detailInfo['Resource Type'])
      .filter((chain) => chain.ResourceType !== recordType);

    setLogContext(contextEntries);
  }, [detailInfo.Context, recordType, detailInfo['Resource Type']]);

  return (
    <CustomDrawer drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen}>
      <Box>
        <EventNote fontSize="large" color="primary" />
        <Typography variant="h4" color="primary">
          {detailInfo.Event}
        </Typography>
        <Typography variant="subtitle2">{friendlyEventDate}</Typography>
        <ActivityContentBox entry={detailInfo} logContext={logContext} />
      </Box>
    </CustomDrawer>
  );
}

export default ActivityDetails;
