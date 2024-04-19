import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Button, Paper, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableRow, TextField, Typography } from '@mui/material';
import { Cancel, Edit, Save } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
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
  hasSavedChanges: boolean;
}

// Define the EditButtons component outside the UserDetail component
function EditButtons(props : EditButtonsProps) {
  const { editing, setEditing, onSave, hasSavedChanges } = props;
  if (editing) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
        <Button
          startIcon={<Save />}
          size="large"
          variant="contained"
          color="success"
          disabled={!hasSavedChanges}
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
  const [user, setUser] = useState<UserDetails | null>(null);
  const [editedValues, setEditedValues] = useState<{ [key: string]: any }>({});
  const [errMsg, setErrMsg] = useState<string | null>(null);
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
        console.log('User:', userDto);
        setUser(userDto);
        setEditedValues(userDto); // Initialize editedValues with the original user data
      } else {
        setErrMsg('User could not be accessed');
      }
    };

    if (token && tokenLoading === LoadingState.SUCCESS) {
      updateUser();
    }
  }, [userObjectId, token, tokenLoading]);

  const renderRow = (field: keyof UserDetails, value: any) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setEditedValues((prevValues) => ({
        ...prevValues,
        [field]: event.target.value,
      }));
    };
    if (editing) {
      console.log('Field:', field, 'Value:', value, 'typeof value:', typeof value);
      switch (typeof value) {
        case 'string':
          if (field === 'created') {
            return (
              <TableRow key={field}>
                <TableCell width="200em">{readableNames[field] || field}</TableCell>
                <TableCell>
                  {field === 'created'
                    ? isoDateLocalDate(value)
                    : value}
                </TableCell>
              </TableRow>
            );
          }
          return (
            <TableRow key={field}>
              <TableCell width="200em">{readableNames[field] || field}</TableCell>
              <TableCell>
                <TextField
                  value={editedValues[field] || ''}
                  onChange={handleChange}
                  variant="outlined"
                  fullWidth
                  size="small"
                />
              </TableCell>
            </TableRow>
          );
        case 'boolean':
          return (
            <TableRow key={field}>
              <TableCell width="200em">{readableNames[field] || field}</TableCell>
              <TableCell>
                <Switch
                  size="small"
                  checked={editedValues[field] || false}
                  onChange={(event) => setEditedValues((prevValues) => ({
                    ...prevValues,
                    [field]: event.target.checked,
                  }))}
                />
              </TableCell>
            </TableRow>
          );
        case 'object':
          if (value === null) {
            return (
              <TableRow key={field}>
                <TableCell width="200em">{readableNames[field] || field}</TableCell>
                <TableCell>
                  <TextField
                    value={editedValues[field] || ''}
                    onChange={handleChange}
                    variant="outlined"
                    fullWidth
                    size="small"
                  />
                </TableCell>
              </TableRow>
            );
          }
          return (
            <TableRow key={field}>
              <TableCell width="200em">{readableNames[field] || field}</TableCell>
              <TableCell>
                {field === 'created'
                  ? isoDateLocalDate(value)
                  : value}
              </TableCell>
            </TableRow>
          );
          break;
        default:
          return (
            <TableRow key={field}>
              <TableCell width="200em">{readableNames[field] || field}</TableCell>
              <TableCell>{value}</TableCell>
            </TableRow>
          );
      }
    }

    return (
      <TableRow key={field}>
        <TableCell width="200em">{readableNames[field] || field}</TableCell>
        <TableCell>
          {field === 'created'
            ? isoDateLocalDate(value)
            : value}
        </TableCell>
      </TableRow>
    );
  };

  const onSave = () => {
    // Save the edited values
    console.log('Edited values:', editedValues);
  };

  const hasChanges = Object.entries(editedValues).some(
    ([field, value]) => value !== user?.[field as keyof UserDetails],
  );

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
        <EditButtons
          editing={editing}
          setEditing={setEditing}
          onSave={onSave}
          hasSavedChanges={hasChanges}
        />
      </Stack>
      {errMsg ? <Alert severity="error">{errMsg}</Alert> : null}
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableBody>
            {Object.entries(user).map(([field, value]) => {
              if (typeof value !== 'object' || value === null) {
                return renderRow(field as keyof UserDetails, value);
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
