import React, { FC } from 'react';
import { IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ActivityContentBox from './ActivityContentBox';
import { ActivityDetailInfo } from './activityViewModels.interface';
import { formatDate } from '../../../utilities/dateUtils';
import PageTitle from '../PageTitle';
import DetailedText from '../Page/DetailedText';
import ATDrawer from '../ATDrawer';

interface ActivityDetailProps {
  onClose: () => void,
  detailInfo: ActivityDetailInfo,
}

const ActivityDetails: FC<ActivityDetailProps> = ({ onClose, detailInfo }) => {
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
        <PageTitle title={detailInfo['Operation name']} />
        <DetailedText text={friendlyEventDate} isSubHeading />
        <ActivityContentBox entry={detailInfo} marginTop="45px" />
      </Box>

      {/* Close button (top-aligned, on the right) */}
      <IconButton
        edge="end"
        onClick={onClose}
        sx={{
          alignSelf: 'flex-start', // Align the close button to the top
          color: 'rgb(0,0,0,0.54)',
        }}
      >
        <CloseIcon />
      </IconButton>
    </Box>
  );
    
  return (
    <ATDrawer onClose={onClose} children={banner} />
  );
};

export default ActivityDetails;
