import { useCallback } from "react";
import { useFocusEffect } from "expo-router";

/**
 * Re-runs `refetch` every time the screen comes into focus.
 * Keeps stale data from showing when the user navigates back.
 *
 * Usage:
 *   const { refetch } = useQuery({ ... });
 *   useRefreshOnFocus(refetch);
 */
export function useRefreshOnFocus(refetch: () => void) {
  const refetchRef = useCallback(() => {
    refetch();
  }, [refetch]);

  useFocusEffect(
    useCallback(() => {
      refetchRef();
    }, [refetchRef])
  );
}
