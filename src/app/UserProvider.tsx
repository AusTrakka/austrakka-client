/* eslint-disable react/jsx-no-useless-fragment */
import React, { ReactNode, useEffect } from 'react';
import { useAppDispatch } from './store';
import { fetchUserRoles } from './userSlice';
import LoadingState from '../constants/loadingState';
import { useApi } from './ApiContext';

interface UserProviderProps {
  children: ReactNode;
}

function UserProvider({ children }: UserProviderProps) {
  const dispatch = useAppDispatch();
  const { token, tokenLoading } = useApi();

  useEffect(() => {
    if (tokenLoading !== LoadingState.IDLE && tokenLoading !== LoadingState.LOADING) {
      dispatch(fetchUserRoles(token));
    }
  }, [token, tokenLoading, dispatch]);

  return <>{ children }</>;
}

export default UserProvider;
