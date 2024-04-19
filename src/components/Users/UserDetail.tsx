import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Button, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import { Cancel, Edit, Save } from '@mui/icons-material';
import { getUser } from '../../utilities/resourceUtils';
import { UserDetails } from '../../types/dtos';
import { useApi } from '../../app/ApiContext';
import LoadingState from '../../constants/loadingState';
import { isoDateLocalDate } from '../../utilities/helperUtils';
import { ResponseObject } from '../../types/responseObject.interface';
import { ResponseType } from '../../constants/responseType';
import RenderGroupedRolesAndGroups from './RoleSortingAndRender/RenderGroupedRolesAndGroups';
import renderIcon from '../Admin/UserIconRenderer';

interface EditButtonsProps {
  editing: boolean;
  setEditing: Dispatch<SetStateAction<boolean>>;
  onSave: () => void;
}

// Define the EditButtons component outside the UserDetail component
function EditButtons(props : EditButtonsProps) {
  const { editing, setEditing, onSave } = props;
  if (editing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
        <Button
          startIcon={<Save />}
          size="large"
          variant="contained"
          color="success"
          style={{ marginRight: '1rem' }}
          onClick={() => {
            setEditing(false);
            onSave(); // Call the onSave function when saving
          }}
        >
          Save
        </Button>
        <Button
          startIcon={<Cancel />}
          size="large"
          variant="contained"
          color="error"
          onClick={() => setEditing(false)}
        >
          Cancel
        </Button>
      </div>
    );
  }
  return (
    <Button
      startIcon={<Edit />}
      size="large"
      variant="contained"
      color="primary"
      onClick={() => setEditing(true)}
    >
      Edit
    </Button>
  );
}

function UserDetail() {
  const { userObjectId } = useParams();
  const { token, tokenLoading } = useApi();
  const [editing, setEditing] = useState(false);
  const [user, setUser] = useState<UserDetails | null>();
  const [errMsg, setErrMsg] = useState<string | null>();
  const [openRoleGroups, setOpenRoleGroups] = useState<string[]>([]);

  const readableNames: Record<string, string> = {
    'displayName': 'Display Name',
    'orgName': 'Organisation',
    'orgAbbrev': 'Organisation Abbreviation',
    'created': 'Created Date',
    'contactEmail': 'Email',
  };

  useEffect(() => {
    const updateUser = async () => {
      const userResponse: ResponseObject = await getUser(userObjectId!, token);

      if (userResponse.status === ResponseType.Success) {
        const userDto = userResponse.data as UserDetails;
        setUser(userDto);
      } else {
        setErrMsg('User could not be accessed');
      }
    };

    if (token && tokenLoading === LoadingState.SUCCESS) {
      updateUser();
    }
  }, [userObjectId, token, tokenLoading]);

  const renderRow = (field: string, value: any) => (
    <TableRow key={field}>
      <TableCell width="200em">{field}</TableCell>
      <TableCell>
        {field === 'Last Logged In' || field === 'Created Date'
          ? isoDateLocalDate(value)
          : value}
      </TableCell>
    </TableRow>
  );

  const onSave = () => {
    // Save the user data
  };

  // Assuming handleSave is defined elsewhere

  return user ? (
    <div>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        display="flex"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {renderIcon(user, 'large')}
          <Typography className="pageTitle" style={{ paddingBottom: 0 }}>
            {user.displayName}
          </Typography>
        </div>
        <EditButtons editing={editing} setEditing={setEditing} onSave={onSave} />
      </Stack>
      {errMsg ? <Alert severity="error">{errMsg}</Alert> : null}
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableBody>
            {Object.entries(user).map(([field, value]) => {
              if (typeof value !== 'object' || value === null) {
                return renderRow(readableNames[field] || field, value);
              }
              if (field === 'userRoleGroup') {
                return (
                  <RenderGroupedRolesAndGroups
                    key={field}
                    user={user}
                    userRoleGroups={user.userRoleGroup}
                    openRoleGroups={openRoleGroups}
                    setOpenRoleGroups={setOpenRoleGroups}
                  />
                );
              }
              return null;
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  ) : null;
}

export default UserDetail;
