import { QueryClient } from "@tanstack/react-query";
import { setAuthTokenGetter } from "@workspace/api-client-react";

// Inject admin JWT (shared sessionStorage key with SBG ARMY) into all API calls
setAuthTokenGetter(() => {
  try { return sessionStorage.getItem('sbg_admin_token') ?? null; } catch { return null; }
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
