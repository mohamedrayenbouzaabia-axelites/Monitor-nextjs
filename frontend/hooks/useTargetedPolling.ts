import { useEffect, useRef, useCallback } from 'react';

interface UseTargetedPollingOptions {
  interval?: number;
  enabled?: boolean;
  onStop?: () => void;
}

/**
 * Custom hook for targeted polling using useRef instead of setInterval
 * Only refreshes the specific callback function, not the entire interface
 */
export function useTargetedPolling(
  callback: () => Promise<void> | void,
  options: UseTargetedPollingOptions = {}
) {
  const { interval = 5000, enabled = true, onStop } = options;
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

  const poll = useCallback(async () => {
    if (!isActiveRef.current || !callbackRef.current) {
      return;
    }

    try {
      await callbackRef.current();
    } catch (error) {
      console.error('Polling error:', error);
    }

    // Only schedule next poll if still active
    if (isActiveRef.current) {
      timeoutRef.current = setTimeout(poll, interval);
    }
  }, [interval]);

  const start = useCallback(() => {
    if (!isActiveRef.current) {
      isActiveRef.current = true;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(poll, 0);
  }, [poll]);

  const stop = useCallback(() => {
    isActiveRef.current = false;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    onStop?.();
  }, [onStop]);

  const isPolling = () => isActiveRef.current;

  // Start polling when enabled
  useEffect(() => {
    if (enabled) {
      start();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, start]);

  return {
    start,
    stop,
    isPolling
  };
}