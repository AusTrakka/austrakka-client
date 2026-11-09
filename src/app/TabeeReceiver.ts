import { createBridge } from '@tabee/browser';
import { NEWICK_V1, normalizeFormatKey, registryCapability } from '@tabee/formats';
import { useEffect, useRef } from 'react';
import { type NavigateFunction, useNavigate } from 'react-router-dom';
import store from './store';
import { addTree } from './treeSlice';

// Initial receiver version by @Wytamma

type WithResolvers = <T>() => {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

// CDEP's handshake and consent use Promise.withResolvers (ES2024).
if (typeof Promise.withResolvers !== 'function') {
  const polyfill: WithResolvers = <T>() => {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
  Promise.withResolvers = polyfill;
}

function TabeeReceiver() {
  const navigate = useNavigate();
  const navigateRef = useRef<NavigateFunction>(navigate);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    const bridge = createBridge({
      application: {
        name: import.meta.env.VITE_BRANDING_NAME || 'Trakka',
        url: `${window.location.origin}${window.location.pathname}`,
      },
      normalizeFormatKey,
      imports: {
        [NEWICK_V1]: (files, context) => {
          const sourceApplication = context.senderApplication;
          for (const [idx, file] of files.entries()) {
            if (typeof file.data !== 'string') {
              throw new Error(`Newick file "${file.name}" must be text`);
            }
            // Does not yet allow the sender to specify the tree name
            const treeName = `Tree ${idx + 1} from ${sourceApplication}`;
            store.dispatch(addTree({ name: treeName, newickTree: file.data }));
          }
          const { trees } = store.getState().treeState;
          const importedTree = trees[trees.length - 1];
          if (importedTree !== undefined) {
            navigateRef.current(`/data/trees/${importedTree.treeId}`);
          }
        },
      },
      importCapabilities: {
        [NEWICK_V1]: registryCapability(NEWICK_V1),
      },
    });
    return () => bridge.destroy();
  }, []);

  return null;
}

export default TabeeReceiver;
