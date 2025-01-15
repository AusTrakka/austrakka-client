import React, { ReactNode, useEffect, useState } from 'react';
import { useAppDispatch } from './store';
import LoadingState from '../constants/loadingState';
import { useApi } from './ApiContext';
import './UserProvider.css';
import { fetchDefaultTenant } from './tenantSlice';

interface TenantProviderProps {
  children: ReactNode;
}

function TenantProvider({ children }: TenantProviderProps) {
  const dispatch = useAppDispatch();
  const { token, tokenLoading } = useApi();
  const [tenantReady, setTenantReady] = useState(false); // Track if tenant data is ready

  // Fetch roles only after tenant data is ready
  useEffect(() => {
    const fetchTenantData = async () => {
      await dispatch(fetchDefaultTenant(token));
      setTenantReady(true); // Mark tenant data as ready
    };

    if (tokenLoading !== LoadingState.IDLE &&
        tokenLoading !== LoadingState.LOADING &&
        !tenantReady // Ensure tenant has been dispatched
    ) {
      fetchTenantData();
    }
  }, [token, tokenLoading, tenantReady, dispatch]);

  return (
    tenantReady ? <div>{children}</div> : <div>Loading...</div>
  );
}

export default TenantProvider;
