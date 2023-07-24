import { useLocation } from 'react-router-dom';

export default function useQueryParams<T extends {}>(defaultState: T): Partial<T> {
  const searchParams = new URLSearchParams(useLocation().search);

  const params: any = {};
  for (const param of searchParams) {
    const [key, value] = param;

    if (key in defaultState) {
      // Add case for 'null' value
      if (value === 'null') {
        params[key] = null;
      } else {
        let expectedType;
        if (key === 'rootId') {
          expectedType = 'string';
        } else {
          expectedType = typeof defaultState[key as keyof T];
        }
        // Parse based on the type of the corresponding key in defaultState.
        switch (expectedType) {
          case 'boolean':
            params[key] = value === 'true';
            break;
          case 'number':
            params[key] = Number(value);
            break;
          case 'string':
            params[key] = value;
            break;
          case 'object':
            // We assume the 'object' type corresponds to an array.
            // Adjust this logic if your state contains other kinds of objects.
            params[key] = value.split(',');
            break;
          default:
            params[key] = value;
        }
      }
    }
  }

  return params as Partial<T>;
}
