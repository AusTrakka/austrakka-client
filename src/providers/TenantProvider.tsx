import React, { ReactNode, useEffect, useState } from 'react';
import './UserProvider.css';
import { useAppDispatch } from '../app/store';
import { fetchDefaultTenant } from '../app/tenantSlice';

interface TenantProviderProps {
  children: ReactNode;
}

function TenantProvider({ children }: TenantProviderProps) {
  const dispatch = useAppDispatch();
  const [tenantReady, setTenantReady] = useState(false); // Track if tenant data is ready
  
  // Fetch roles only after tenant data is ready
  useEffect(() => {
    const fetchTenantData = async () => {
      await dispatch(fetchDefaultTenant('emptytoken'));
      setTenantReady(true); // Mark tenant data as ready
    };
    
    fetchTenantData();
  }, [tenantReady, dispatch]);

  return (
    tenantReady ? <div>{children}</div> : <div>Loading...</div>
  );
}

export default TenantProvider;
