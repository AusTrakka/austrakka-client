import React, { ReactNode, useEffect, useState } from 'react';
import LoadingState from '../constants/loadingState';
import { logoOnlyUrl } from '../constants/logoPaths';
import './UserProvider.css';
import { useApi } from '../app/ApiContext';
import { useAppDispatch } from '../app/store';
import { fetchUserRoles } from '../app/userSlice';

interface UserProviderProps {
  children: ReactNode;
}

function UserProvider({ children }: UserProviderProps) {
  const { token, tokenLoading } = useApi();
  const dispatch = useAppDispatch();
  const [rolesLoading, setRolesLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [showChildren, setShowChildren] = useState(false);

  // Fetch roles only after tenant data is ready
  useEffect(() => {
    const fetchRolesData = async () => {
      await dispatch(fetchUserRoles(token));
      setTransitioning(true);
      setTimeout(() => {
        setRolesLoading(false);
        setShowChildren(true);
      }, 400);
    };
    
    if (
      tokenLoading !== LoadingState.IDLE &&
      tokenLoading !== LoadingState.LOADING
    ) {
      fetchRolesData();
    }
  }, [token, tokenLoading, rolesLoading, dispatch]);

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
