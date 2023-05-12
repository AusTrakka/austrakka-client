import {
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
    }
  }
});

// Returns valid token or generates a new valid token
export async function getToken() {
  const currentAccount = msalInstance.getActiveAccount();
  const request = {
    scopes: [import.meta.env.VITE_API_SCOPE],
    account: currentAccount || undefined,
  };
  return msalInstance.acquireTokenSilent(request).catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    // TODO: This is the wrong spot, needs to be in component tree
    // If we want to fallback to interaction when silent call fails
    // msalInstance.acquireTokenRedirect(request);
    return null;
  });
}
