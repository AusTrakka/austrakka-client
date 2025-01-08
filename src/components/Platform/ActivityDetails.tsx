import React, {FC} from 'react';
import {IconButton, Box} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ATDrawer from "../Common/ATDrawer";
import PageTitle from "../Common/PageTitle";
import DetailedText from "../Common/Page/DetailedText";
import ActivityContentBox from "./ActivityContentBox";
import {ActivityDetailInfo} from "./activityViewModels.interface";

interface ActivityDetailProps {
    onClose: () => void,
    detailInfo: ActivityDetailInfo,
}

const ActivityDetails: FC<ActivityDetailProps> = ({onClose, detailInfo}) => {
    const date = new Date(detailInfo["Time stamp"]);
    const friendlyEventDate = date.toLocaleString('en-GB', {
        weekday: 'short', // 'Fri'
        year: 'numeric', // '2024'
        month: 'short', // 'Nov'
        day: 'numeric', // '15'
        hour: '2-digit', // '11'
        minute: '2-digit', // '55'
        second: '2-digit', // '00'
        timeZoneName: 'longOffset',
    });
    
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
                <PageTitle title={detailInfo["Operation name"]} />
                <DetailedText text={friendlyEventDate} />
                <ActivityContentBox entry={detailInfo} marginTop="45px"/>
            </Box>

            {/* Close button (top-aligned, on the right) */}
            <IconButton
                edge="end"
                color="inherit"
                onClick={onClose}
                sx={{
                    alignSelf: 'flex-start', // Align the close button to the top
                }}
            >
                <CloseIcon />
            </IconButton>
        </Box>
    );
    
    return (
        <ATDrawer onClose={onClose} children={banner} />
    );
}

export default ActivityDetails;
