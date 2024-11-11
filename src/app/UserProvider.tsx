/* eslint-disable react/jsx-no-useless-fragment */
import React, { ReactNode, useEffect, useState } from 'react';
import { useAppDispatch } from './store';
import { fetchUserRoles } from './userSlice';
import LoadingState from '../constants/loadingState';
import { useApi } from './ApiContext';
import { logoOnlyUrl } from '../constants/logoPaths';
import './UserProvider.css';

interface UserProviderProps {
  children: ReactNode;
}

function UserProvider({ children }: UserProviderProps) {
  const dispatch = useAppDispatch();
  const { token, tokenLoading } = useApi();
  const [rolesLoading, setRolesLoading] = useState(true);

  useEffect(() => {
    if (tokenLoading !== LoadingState.IDLE && tokenLoading !== LoadingState.LOADING) {
      const fetchRoles = async () => {
        await dispatch(fetchUserRoles(token));
        setRolesLoading(false);
      };
      fetchRoles();
    }
  }, [token, tokenLoading, dispatch]);
  if (rolesLoading) {
    return (
      <div className="loading-container">
        <div className="ripple" />
        <img src={logoOnlyUrl} alt="Loading" className="image" />
      </div>
    );
  }

  return <>{children}</>;
}

export default UserProvider;
