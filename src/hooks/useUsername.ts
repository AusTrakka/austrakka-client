import {useEffect, useState} from "react";
import {AccountInfo} from "@azure/msal-browser";

export default function useUsername(account: AccountInfo | null) {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (account && account.username) {
      setUsername(account.username); // seems to be login email
    }
  }, [account]);

  return username;
}