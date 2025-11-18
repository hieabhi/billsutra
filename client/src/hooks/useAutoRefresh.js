import { useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for auto-refreshing data at regular intervals
 * @param {Function} refreshFn - Function to call for refreshing data
 * @param {number} interval - Refresh interval in milliseconds (default: 5000ms = 5 seconds)
 * @param {boolean} enabled - Whether auto-refresh is enabled (default: true)
 */
export const useAutoRefresh = (refreshFn, interval = 5000, enabled = true) => {
  const intervalRef = useRef(null);
  const refreshFnRef = useRef(refreshFn);

  // Keep refreshFn reference up to date
  useEffect(() => {
    refreshFnRef.current = refreshFn;
  }, [refreshFn]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (!enabled) return;

    // Initial refresh
    refreshFnRef.current();

    // Set up interval
    intervalRef.current = setInterval(() => {
      refreshFnRef.current();
    }, interval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval, enabled]);

  // Manual refresh function
  const manualRefresh = useCallback(() => {
    refreshFnRef.current();
  }, []);

  return { manualRefresh };
};

/**
 * Custom hook for triggering refresh after mutations
 * Automatically refreshes data after a short delay to ensure backend updates are complete
 */
export const useRefreshAfterMutation = (refreshFn) => {
  const refreshFnRef = useRef(refreshFn);

  useEffect(() => {
    refreshFnRef.current = refreshFn;
  }, [refreshFn]);

  const refreshAfterMutation = useCallback(async (mutationFn) => {
    try {
      const result = await mutationFn();
      // Instant refresh - minimal delay to ensure backend updates propagate
      setTimeout(() => {
        refreshFnRef.current();
      }, 50);
      return result;
    } catch (error) {
      // Still refresh on error to sync state
      setTimeout(() => {
        refreshFnRef.current();
      }, 50);
      throw error;
    }
  }, []);

  return { refreshAfterMutation };
};
