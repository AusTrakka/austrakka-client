import React from 'react';
import { IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ActivityContentBox from './ActivityContentBox';
import { ActivityDetailInfo } from './activityViewModels.interface';
import { formatDate } from '../../../utilities/dateUtils';
import DetailedText from '../Page/DetailedText';
import ATDrawer from '../ATDrawer';
import BannerTitle from './ActivityBannerTitle';
import { Theme } from '../../../assets/themes/theme';

interface ActivityDetailProps {
  onClose: () => void,
  detailInfo: ActivityDetailInfo,
}

function ActivityDetails({ onClose, detailInfo }: ActivityDetailProps): JSX.Element {
  const friendlyEventDate = formatDate(detailInfo['Time stamp']);
    
  const banner = (
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

      {/* Close button (top-aligned, on the right) */}
      <IconButton
        edge="end"
        onClick={onClose}
        sx={{
          alignSelf: 'flex-start', // Align the close button to the top
          color: Theme.PrimaryGrey900,
        }}
      >
        <CloseIcon />
      </IconButton>
    </Box>
  );
    
  return (
    <ATDrawer onClose={onClose}>
      {banner}
    </ATDrawer>
  );
}

export default ActivityDetails;
