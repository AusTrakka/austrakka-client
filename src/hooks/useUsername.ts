import type { AccountInfo } from '@azure/msal-browser';
import { useEffect, useState } from 'react';

export default function useUsername(account: AccountInfo | null) {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (account?.username) {
      setUsername(account.username); // seems to be login email
    }
  }, [account]);

  return username;
}
