import {
  InteractionRequiredAuthError,
  PublicClientApplication, EventType, EventMessage, AuthenticationResult,
} from '@azure/msal-browser';
import { msalConfig } from '../config/authConfig';

export const msalInstance = new PublicClientApplication(msalConfig);

msalInstance.addEventCallback((event: EventMessage) => {
  if (event.payload) {
    const payload = event.payload as AuthenticationResult;
    const { account } = payload;
    if (event.eventType === EventType.LOGIN_SUCCESS) {
      msalInstance.setActiveAccount(account);
    } else if (event.eventType === EventType.ACQUIRE_TOKEN_FAILURE) {
      // TODO: add logout redirect
      console.log('logout user now');
    }
  }
});

// Returns valid token or generates a new valid token
export default async function getToken() {
  const currentAccount = msalInstance.getActiveAccount();

  if (currentAccount) {
    const accessTokenRequest = {
      scopes: [import.meta.env.VITE_API_SCOPE],
      account: currentAccount,
    };
    const accessToken = msalInstance
      .acquireTokenSilent(accessTokenRequest)
      .then((accessTokenResponse) => accessTokenResponse.accessToken)
      .catch((error) => {
        if (error instanceof InteractionRequiredAuthError) {
          msalInstance
            .acquireTokenPopup(accessTokenRequest)
            .then((accessTokenResponse) => accessTokenResponse.accessToken)
            .catch((tokenError) => {
              console.log(tokenError);
            });
        }
        console.log(error);
        return null;
      });
    return accessToken;
  }
  return null;
}
