import { useEffect, useRef, useState } from 'react';
import type MetadataLoadingState from '../../constants/metadataLoadingState';

const useMaxHeaderHeight = (loadingState: MetadataLoadingState) => {
  const [maxHeight, setMaxHeight] = useState(0);
  const headerRefs = useRef<any>([]);
  // Add a state variable to trigger the effect

  // biome-ignore lint/correctness/useExhaustiveDependencies: historic
    useEffect(() => {
    const heights = headerRefs.current.map((ref: any) => {
      if (ref?.clientWidth) {
        return ref.clientWidth;
      }
      return 0;
    });

    // Check if heights array is not empty
    if (heights.length > 0) {
      setMaxHeight(Math.max(...heights));
    }
  }, [loadingState]); 
  
  const getHeaderRef = (ref: any, index: any) => {
    if (ref) {
      headerRefs.current[index] = ref;
    }
  };

  return { maxHeight, getHeaderRef };
};

export default useMaxHeaderHeight;
