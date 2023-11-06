import React from 'react';
import { Card, CardContent, CircularProgress, Grid, Tooltip, Typography } from '@mui/material';
import { Error } from '@mui/icons-material';
import { Member } from '../../types/dtos';

interface OrgMembersProps {
  isMembersLoading: boolean,
  memberList: Member[],
  memberListError: boolean,
  memberListErrorMessage: string,
}

function UserCard({ user }: { user: Member }) {
  const cardStyle = {
    width: '250px',
    height: '100px',
    display: 'flex',
    flexDirection: 'column', // Stack content vertically
    justifyContent: 'flex-end', // Align content at the bottom
  };

  const contentStyle = {
    padding: '8px', // Add some padding
    borderBottom: '4px solid #90ca6d',
  };

  return (
    <Card sx={cardStyle}>
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
