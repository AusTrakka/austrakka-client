import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Chip, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography, Box, IconButton, Collapse, Stack } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { getUser } from '../../utilities/resourceUtils';
import { UserDetails, UserRoleGroup } from '../../types/dtos';
import { useApi } from '../../app/ApiContext';
import LoadingState from '../../constants/loadingState';
import { isoDateLocalDate } from '../../utilities/helperUtils';
import { ResponseObject } from '../../types/responseObject.interface';
import { ResponseType } from '../../constants/responseType';

function UserDetail() {
  const { userObjectId } = useParams();
  const { token, tokenLoading } = useApi();
  const [user, setUser] = useState<UserDetails | null>();
  const [errMsg, setErrMsg] = useState<string | null>();
  const readableNames: Record<string, string> = {
    'displayName': 'Display Name',
    'orgName': 'Organisation',
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

  const [openRoleGroups, setOpenRoleGroups] = useState<string[]>([]);

  const handleRoleGroupToggle = (groupName: string) => {
    setOpenRoleGroups((prev) => {
      if (prev.includes(groupName)) {
        return prev.filter((group) => group !== groupName);
      }
      return [...prev, groupName];
    });
  };

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
      <>
        <TableRow>
          <TableCell width="200em" colSpan={2}>
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => handleRoleGroupToggle(groupName)}
            >
              {openRoleGroups.includes(groupName) ?
                <KeyboardArrowUpIcon /> :
                <KeyboardArrowDownIcon />}
            </IconButton>
            someParent
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ padding: 0 }} colSpan={2}>
            <Box sx={{ width: '100%' }}>
              <Collapse in={openRoleGroups.includes(groupName)} timeout="auto" unmountOnExit>
                <Stack direction="row" spacing={2} padding={2} alignItems="center">
                  <Typography variant="body2">
                    {groupName}
                    -roles
                  </Typography>
                  <div>
                    {roleNames.map((roleName) => (
                      <Chip sx={{ marginX: 0.5 }} key={roleName} label={roleName} color="primary" variant="outlined" />
                    ))}
                  </div>
                </Stack>
              </Collapse>
            </Box>
          </TableCell>
        </TableRow>
      </>
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
