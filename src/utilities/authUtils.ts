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
