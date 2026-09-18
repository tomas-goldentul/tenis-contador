import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

export function useNetwork(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    if (typeof NetInfo?.addEventListener === "function") {
      unsub = NetInfo.addEventListener((state) => {
        setOnline(state.isConnected !== false && state.isInternetReachable !== false);
      });
    } else {
      setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    }
    return () => unsub?.();
  }, []);

  return online;
}