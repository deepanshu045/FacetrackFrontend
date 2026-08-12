import { useCallback } from "react";
import { clearAuthToken } from "../services/api";
import { useAppContext } from "../context/AppContext";

// Centralized logout hook. If an AppContext logout is available, call it
// to perform a client-side navigation back to login. Otherwise fall back
// to clearing token and reloading the page.
export function useLogout() {
  const ctx = useAppContext();

  return useCallback(() => {
    try {
      clearAuthToken();
    } catch (e) {
      // swallow
    }

    if (ctx?.logout) {
      ctx.logout();
      return;
    }

    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }, [ctx]);
}
