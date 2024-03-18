import { useEffect, useRef, useState } from 'react';
import MetadataLoadingState from '../../constants/metadataLoadingState';

const useMaxHeaderHeight = (loadingState: MetadataLoadingState) => {
  const [maxHeight, setMaxHeight] = useState(0);
  const headerRefs = useRef<any>([]);
  // Add a state variable to trigger the effect

  useEffect(() => {
    const heights = headerRefs.current.map((ref: any) => {
      if (ref && ref.clientWidth) {
        return ref.clientWidth;
      }
      return 0;
    });

    // Check if heights array is not empty
    if (heights.length > 0) {
      setMaxHeight(Math.max(...heights));
    }
  }, [loadingState]); // Use setTrigger as the dependency

  const getHeaderRef = (ref: any, index: any) => {
    if (ref) {
      headerRefs.current[index] = ref;
    }
  };

  return { maxHeight, getHeaderRef };
};

export default useMaxHeaderHeight;
