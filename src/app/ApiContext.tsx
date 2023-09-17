import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError, InteractionStatus } from '@azure/msal-browser';
import LoadingState from '../constants/loadingState';

interface ApiContextInterface {
  token: any,
  tokenLoading: LoadingState,
}

const ApiContext = createContext<ApiContextInterface>({
  token: null,
  tokenLoading: LoadingState.IDLE,
});

// ApiProvider: Implements the ApiContext
export default function ApiProvider({ children } : any) {
  const { instance, inProgress, accounts } = useMsal();
  const [authToken, setAuthToken] = useState<any>(null);
  const [authTokenLoading, setAuthTokenLoading] = useState<LoadingState>(LoadingState.IDLE);

  useEffect(() => {
    if (inProgress === InteractionStatus.None) {
      setAuthTokenLoading(LoadingState.LOADING);
      const accessTokenRequest = {
        scopes: [import.meta.env.VITE_API_SCOPE],
        account: accounts[0],
      };
      instance
        .acquireTokenSilent(accessTokenRequest)
        .then((accessTokenResponse) => {
          setAuthToken(accessTokenResponse.accessToken);
          setAuthTokenLoading(LoadingState.SUCCESS);
        })
        .catch((error) => {
          if (error instanceof InteractionRequiredAuthError) {
            instance.acquireTokenRedirect(accessTokenRequest);
          }
          // eslint-disable-next-line no-console
          console.log(error);
          setAuthToken(null);
          setAuthTokenLoading(LoadingState.ERROR);
        });
    }
  }, [instance, accounts, inProgress]);

  const tokenState = useMemo(() => (
    { token: authToken, tokenLoading: authTokenLoading }
  ), [authToken, authTokenLoading]);

  return (
    <ApiContext.Provider value={tokenState}>
      {children}
    </ApiContext.Provider>
  );
}

// useApi: custom hook so that other components can utilse the context
export function useApi() {
  return useContext(ApiContext);
}
