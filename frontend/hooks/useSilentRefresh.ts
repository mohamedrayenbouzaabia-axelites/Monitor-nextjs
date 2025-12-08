import { useEffect, useRef, useCallback } from 'react';

interface UseSilentRefreshOptions {
  interval?: number;
  enabled?: boolean;
  onUpdate?: (data: any) => void;
}

/**
 * Hook for silent data refreshing that doesn't cause component re-renders
 * Stores data in refs and only calls onUpdate when you want to update specific parts
 */
export function useSilentRefresh(
  fetchFunction: () => Promise<any>,
  options: UseSilentRefreshOptions = {}
) {
  const { interval = 30000, enabled = true, onUpdate } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef<boolean>(enabled);
  const dataRef = useRef<any>(null);
  const fetchFunctionRef = useRef<(() => Promise<any>) | null>(fetchFunction);

  // Update refs when dependencies change
  useEffect(() => {
    fetchFunctionRef.current = fetchFunction;
  }, [fetchFunction]);

  useEffect(() => {
    isActiveRef.current = enabled;
    if (!enabled && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [enabled]);

  const silentFetch = useCallback(async () => {
    if (!isActiveRef.current || !fetchFunctionRef.current) return;

    try {
      const data = await fetchFunctionRef.current();
      dataRef.current = data;

      // Only call onUpdate if provided (for selective DOM updates)
      if (onUpdate) {
        onUpdate(data);
      }
    } catch (error) {
      console.error('Silent refresh error:', error);
    }

    // Schedule next refresh only if still active
    if (isActiveRef.current) {
      timeoutRef.current = setTimeout(silentFetch, interval);
    }
  }, [interval, onUpdate]);

  // Start or stop refreshing based on enabled state
  useEffect(() => {
    if (enabled) {
      silentFetch();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, silentFetch]);

  return {
    data: dataRef.current,
    getCurrentData: () => dataRef.current,
    forceUpdate: silentFetch
  };
}