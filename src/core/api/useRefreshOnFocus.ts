import { useCallback, useRef } from 'react';

import { useFocusEffect } from '@react-navigation/native';

/**
 * Refetch when a screen regains focus (React Navigation keeps screens mounted,
 * so TanStack Query's own focus handling doesn't see tab/stack switches).
 * Skips the initial mount, where the query is already fetching.
 */
export const useRefreshOnFocus = (refetch: () => Promise<unknown>) => {
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      void refetch();
    }, [refetch]),
  );
};
