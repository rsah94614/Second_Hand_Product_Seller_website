import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

/**
 * Returns `true` when the device has a working internet connection.
 * Shows a banner / disables fetch calls when offline.
 *
 * NOTE: Requires installing @react-native-community/netinfo if not present:
 *   npx expo install @react-native-community/netinfo
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(state.isConnected !== false && state.isInternetReachable !== false);
    });
    return unsubscribe;
  }, []);

  return { isOnline };
}
