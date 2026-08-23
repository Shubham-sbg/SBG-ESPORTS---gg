import { useState, useEffect, useCallback } from 'react';
import { Database, getDB, useBroadcastSync, initDB, updateDBCache, resyncFromServer } from '@/lib/database';
import { addWsListener } from '@/lib/wsClient';
import { useQueryClient } from '@tanstack/react-query';
import { resolveThemeBranding } from '@/lib/themeBranding';

export function useWsRealtimeInvalidation() {
  let queryClient: ReturnType<typeof useQueryClient> | null = null;
  try {
    queryClient = useQueryClient();
  } catch {
    // Ignore if rendered outside QueryClientProvider
  }

  useEffect(() => {
    const removeListener = addWsListener((_event: any) => {
      if (queryClient) {
        queryClient.invalidateQueries();
      }
    });
    return removeListener;
  }, [queryClient]);
}

export function useDatabase() {
  const [db, setDb] = useState<Database>(() => getDB());
  const [loading, setLoading] = useState(true);

  let queryClient: ReturnType<typeof useQueryClient> | null = null;
  try {
    queryClient = useQueryClient();
  } catch {
    // Ignore if rendered outside QueryClientProvider
  }

  // Always call setDb(getDB()) — updateDBCache and resyncFromServer both
  // replace dbCache with a new object reference, so Object.is() detects
  // the change and React re-renders.
  const refresh = useCallback(() => {
    setDb(getDB());
    if (queryClient) {
      queryClient.invalidateQueries();
    }
  }, [queryClient]);

  // Initial fetch: always pull from the server so the public website
  // shows live data, not a stale IndexedDB snapshot.
  useEffect(() => {
    initDB().then(() => {
      setDb(getDB());
      setLoading(false);
      if (queryClient) {
        queryClient.invalidateQueries();
      }
    });
  }, [queryClient]);

  // BroadcastChannel: same-browser cross-tab sync.
  useEffect(() => {
    const cleanup = useBroadcastSync(() => {
      resyncFromServer()
        .then(() => {
          setDb(getDB());
          if (queryClient) queryClient.invalidateQueries();
        })
        .catch(() => setDb(getDB()));
    });
    return cleanup;
  }, [queryClient]);

  // WebSocket: cross-device / cross-browser real-time updates.
  useEffect(() => {
    const removeListener = addWsListener((event: any) => {
      const col = event.collection || event.table || event.key;
      const data = event.data !== undefined ? event.data : event.payload;

      if (col && data !== undefined) {
        updateDBCache(col, data);
        setDb(getDB());
      } else if (event.updates && typeof event.updates === 'object') {
        for (const [c, val] of Object.entries(event.updates)) {
          updateDBCache(c, val);
        }
        setDb(getDB());
      } else {
        resyncFromServer()
          .then(() => setDb(getDB()))
          .catch(() => setDb(getDB()));
      }

      if (queryClient) {
        queryClient.invalidateQueries();
      }
    });
    return removeListener;
  }, [queryClient]);

  let previewTheme: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      previewTheme = new URLSearchParams(window.location.search).get('previewTheme');
    } catch {}
  }

  const rawTheme = previewTheme || db?.themeSettings?.activeTheme || db?.settings?.activeTheme || 'classic-sbg-army';
  const activeTheme = rawTheme === 'elite' ? 'new-esports' : (rawTheme === 'luxury_gold' ? 'royal' : rawTheme);
  const resolvedSettings = resolveThemeBranding(db?.settings, activeTheme);

  return { db, refresh, loading, activeTheme, resolvedSettings };
}

