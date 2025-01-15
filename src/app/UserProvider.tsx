/* eslint-disable react/jsx-no-useless-fragment */
import React, { ReactNode, useEffect, useState } from 'react';
import { useAppDispatch } from './store';
import { fetchUserRoles } from './userSlice';
import LoadingState from '../constants/loadingState';
import { useApi } from './ApiContext';
import { logoOnlyUrl } from '../constants/logoPaths';
import './UserProvider.css';
import { fetchDefaultTenant } from './tenantSlice';

interface UserProviderProps {
  children: ReactNode;
}

function UserProvider({ children }: UserProviderProps) {
  const dispatch = useAppDispatch();
  const { token, tokenLoading } = useApi();
  const [rolesLoading, setRolesLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [showChildren, setShowChildren] = useState(false);

  useEffect(() => {
    if (tokenLoading !== LoadingState.IDLE && tokenLoading !== LoadingState.LOADING) {
      const fetchRoles = async () => {
        await dispatch(fetchUserRoles(token));
        setTransitioning(true);
        // Remove loading screen from DOM after transition
        setTimeout(() => {
          setRolesLoading(false);
          setShowChildren(true);
        }, 400);
      };
      const fetchTenant = async () => {
        await dispatch(fetchDefaultTenant(token));
      };
      
      if (rolesLoading) {
        fetchTenant();
        fetchRoles();
      }
    }
  }, [token, tokenLoading, dispatch, rolesLoading]);

  return (
    <>
      {rolesLoading && (
        <div className={`loading-container fade ${transitioning ? 'fade-out' : ''}`}>
          <div className="ripple" />
          <img src={logoOnlyUrl} alt="Loading" className="image" />
        </div>
      )}
      {showChildren && <div className="fade fade-in">{children}</div>}
    </>
  );
}

export default UserProvider;
