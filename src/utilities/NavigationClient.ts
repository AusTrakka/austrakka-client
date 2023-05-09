import { NavigationClient, NavigationOptions } from '@azure/msal-browser';
import { NavigateFunction } from 'react-router-dom';

export default class CustomNavigationClient extends NavigationClient {
  private navigate: NavigateFunction;

  constructor(navigate: NavigateFunction) {
    super();
    this.navigate = navigate;
  }

  async navigateInternal(url: string, options: NavigationOptions) {
    const relativePath = url.replace(window.location.origin, '');
    if (options.noHistory) {
      this.navigate(relativePath, { replace: true });
    } else {
      this.navigate(relativePath);
    }

    return false;
  }
}
