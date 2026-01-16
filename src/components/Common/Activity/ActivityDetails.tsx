import React from 'react';
import { Box } from '@mui/material';
import ActivityContentBox from './ActivityContentBox';
import { ActivityDetailInfo } from './activityViewModels.interface';
import { formatDate } from '../../../utilities/dateUtils';
import DetailedText from '../Page/DetailedText';
import BannerTitle from './ActivityBannerTitle';
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
    // TODO ACTIVITY LOG: Fix transition when opening the drawer
    // I think drawer open needs to be parsed like the other instances
    <CustomDrawer drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start', // Align title and button to the top
          justifyContent: 'space-between', // Close button on the right, title/date on the left
          marginBottom: 2, // Optional, space between the top and bottom sections
        }}
      >
        {/* Title and Date (on the left) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <BannerTitle title={detailInfo.Event} />
          <DetailedText text={friendlyEventDate} isSubHeading />
          <ActivityContentBox entry={detailInfo} marginTop="45px" />
        </Box>
      </Box>
    </CustomDrawer>
  );
}

export default ActivityDetails;
