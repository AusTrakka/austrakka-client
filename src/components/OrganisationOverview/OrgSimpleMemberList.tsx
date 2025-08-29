import React from 'react';
import { Card, CardContent, CircularProgress, Grid, Tooltip, Typography } from '@mui/material';
import { Error } from '@mui/icons-material';
import { Member } from '../../types/dtos';
import { useStableNavigate } from '../../app/NavigationContext';

interface OrgMembersProps {
  memberList: Member[],
  memberListError: boolean,
  memberListErrorMessage: string,
  isMembersLoading: boolean,
}

function UserCard({ user }: { user: Member }) {
  const { navigate } = useStableNavigate();
  const cardStyle = {
    width: '250px',
    height: '100px',
    display: 'flex',
    flexDirection: 'column', // Stack content vertically
    justifyContent: 'flex-end', // Align content at the bottom
  };

  const contentStyle = {
    padding: '8px', // Add some padding
    borderBottom: '4px solid var(--secondary-main)',
  };

  function handleCardClick() {
    // Check if the "Object Id" property exists in the selected row
    const url = `/users/${user.objectId}`;
    navigate(url);
  }

  return (
    <Card
      sx={cardStyle}
      onClick={() => handleCardClick()}
      style={{ cursor: 'pointer' }}
    >
      <CardContent sx={contentStyle}>
        <Typography variant="h5">{user.displayName}</Typography>
        <Typography variant="caption">{user.organization.abbreviation}</Typography>
      </CardContent>
    </Card>
  );
}

function OrgMembers(props: OrgMembersProps) {
  const { memberList,
    memberListError,
    memberListErrorMessage,
    isMembersLoading } = props;
  return (
    <>
      {isMembersLoading ? <CircularProgress /> : null}
      {memberListError ? (
        <Tooltip title={memberListErrorMessage}>
          <Error color="error" />
        </Tooltip>
      ) : (
        <Grid container spacing={2}>
          {memberList.map((member) => (
            <Grid item key={member.displayName}>
              <UserCard user={member} />
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );
}

export default OrgMembers;
