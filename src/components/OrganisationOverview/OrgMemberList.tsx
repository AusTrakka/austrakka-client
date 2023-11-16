import React, { useState } from 'react';
import { Alert, Button, Card, CardContent, CardMedia, CircularProgress, Grid, Snackbar, Tooltip, Typography } from '@mui/material';
import { Email, Error } from '@mui/icons-material';
import { Member } from '../../types/dtos';

interface OrgMembersProps {
  isMembersLoading: boolean,
  memberList: Member[],
  memberListError: boolean,
  memberListErrorMessage: string,
}

// WORK IN PROGRESS
function UserCard({ user }: { user: Member }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText('mannhiren@gmail.com');
    setIsCopied(true);
  };

  const handleCloseSnackbar = () => {
    setIsCopied(false);
  };

  return (
    <Card sx={{ width: '300px', height: '200px' }}>
      <div style={{ position: 'relative' }}>
        {/* Banner */}
        <CardMedia
          component="div"
          sx={{
            width: '100%',
            height: '80px',
            backgroundColor: 'lightgrey',
          }}
        />

        {/* Circular Profile Picture */}
        <CardMedia
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            border: '2px solid #000',
            position: 'absolute',
            backgroundColor: 'green',
            top: '50px',
            left: '10px',
          }}
        />

        {/* User Information */}
        <CardContent>
          <Typography variant="h5" paddingLeft={11}>{user.displayName}</Typography>
          {/* Would need to grab more information somehow */}
          <Typography variant="caption" paddingLeft={10}>{user.organization.abbreviation}</Typography>
        </CardContent>
      </div>

      {/* Email Icon */}
      <Button
        variant="text"
        color="primary"
        onClick={handleCopyToClipboard}
        sx={{
          marginLeft: 'auto',
          marginRight: 2,
          marginBottom: 2,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Email />
        <span style={{ marginLeft: '8px' }}>mannhiren@gmail.com</span>
      </Button>

      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={isCopied}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
      >
        <Alert severity="success">
          Copied to clipboard
        </Alert>
      </Snackbar>
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
