import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Chip, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import { ResponseObject, getUser } from '../../utilities/resourceUtils';
import { UserDetails, UserRoleGroup } from '../../types/dtos';
import { useApi } from '../../app/ApiContext';
import LoadingState from '../../constants/loadingState';
import isoDateLocalDate from '../../utilities/helperUtils';

function UserDetail() {
  const { userObjectId } = useParams();
  const { token, tokenLoading } = useApi();
  const [user, setUser] = useState<UserDetails | null>();
  const [errMsg, setErrMsg] = useState<string | null>();

  const readableNames: Record<string, string> = {
    'displayName': 'Display Name',
    'orgName': 'Organisation',
    'lastLoggedIn': 'Last Logged In',
  };
  useEffect(() => {
    const updateUser = async () => {
      const userResponse: ResponseObject = await getUser(userObjectId!, token);
      if (userResponse.status === 'Success') {
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
      <TableCell>{field === 'Last Logged In' ? isoDateLocalDate(value) : value}</TableCell>
    </TableRow>
  );

  const renderGroupedRolesAndGroups = (userRoleGroups: UserRoleGroup[]) => {
    const groupMap = new Map<string, { roleNames: string[] }>();

    userRoleGroups.forEach((userGroup) => {
      const groupName = userGroup.group.name;
      const roleName = userGroup.role.name;

      if (!groupMap.has(groupName)) {
        groupMap.set(groupName, { roleNames: [roleName] });
      } else {
        groupMap.get(groupName)?.roleNames.push(roleName);
      }
    });

    return Array.from(groupMap).map(([groupName, { roleNames }]) => (
      <TableRow key={groupName}>
        <TableCell width="20em">{`${groupName} - Roles`}</TableCell>
        <TableCell>
          {roleNames.map((roleName) => (
            <Chip
              key={roleName}
              label={roleName}
              color="primary"
              variant="outlined"
            />
          ))}
        </TableCell>
      </TableRow>
    ));
  };

  return user ? (
    <div>
      <Typography className="pageTitle">{user.displayName}</Typography>
      {errMsg ? <Alert severity="error">{errMsg}</Alert> : null}
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableBody>
            {Object.entries(user).map(([field, value]) => {
              if (typeof value !== 'object' || value === null) {
                return renderRow(readableNames[field] || field, value);
              }
              if (field === 'userRoleGroup') {
                return renderGroupedRolesAndGroups(value);
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
