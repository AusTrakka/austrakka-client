import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import { getUser } from '../../utilities/resourceUtils';
import { UserDetails } from '../../types/dtos';
import { useApi } from '../../app/ApiContext';
import LoadingState from '../../constants/loadingState';
import { isoDateLocalDate } from '../../utilities/helperUtils';
import { ResponseObject } from '../../types/responseObject.interface';
import { ResponseType } from '../../constants/responseType';
import RenderGroupedRolesAndGroups from './RoleSortingAndRender/RenderGroupedRolesAndGroups';

function UserDetail() {
  const { userObjectId } = useParams();
  const { token, tokenLoading } = useApi();
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
                return (
                  <RenderGroupedRolesAndGroups
                    key={field}
                    user={user}
                    userRoleGroups={user.roleGroups}
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
