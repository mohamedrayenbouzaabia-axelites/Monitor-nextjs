import { useEffect, useRef, useCallback } from 'react';

interface UsePeriodicRefreshOptions {
  interval?: number;
  enabled?: boolean;
}

/**
 * Simplified hook for periodic data refreshing using setTimeout instead of setInterval
 * More efficient than setInterval as it only runs when enabled
 */
export function usePeriodicRefresh(
  callback: () => Promise<void> | void,
  options: UsePeriodicRefreshOptions = {}
) {
  const { interval = 30000, enabled = true } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef<boolean>(enabled);
  const callbackRef = useRef<(() => Promise<void> | void) | null>(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Update active status
  useEffect(() => {
    isActiveRef.current = enabled;
    if (!enabled && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [enabled]);

  const scheduleNextRefresh = useCallback(() => {
    if (!isActiveRef.current) return;

    timeoutRef.current = setTimeout(async () => {
      if (callbackRef.current && isActiveRef.current) {
        try {
          await callbackRef.current();
        } catch (error) {
          console.error('Periodic refresh error:', error);
        }
        // Schedule next refresh only if still active
        if (isActiveRef.current) {
          scheduleNextRefresh();
        }
      }
    }, interval);
  }, [interval]);

  // Start or stop refreshing based on enabled state
  useEffect(() => {
    if (enabled) {
      scheduleNextRefresh();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, scheduleNextRefresh]);

  return {
    isActive: isActiveRef.current
  };
}