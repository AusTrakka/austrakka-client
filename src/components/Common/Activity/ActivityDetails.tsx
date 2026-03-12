import { EventNote } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { formatDate } from '../../../utilities/dateUtils';
import CustomDrawer from '../CustomDrawer';
import ActivityContentBox from './ActivityContentBox';
import type { ActivityDetailInfo } from './activityViewModels.interface';

interface ActivityDetailProps {
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  detailInfo: ActivityDetailInfo;
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
        <Typography variant="subtitle2">{friendlyEventDate}</Typography>
        <ActivityContentBox entry={detailInfo} />
      </Box>
    </CustomDrawer>
  );
}

export default ActivityDetails;
