import { useEffect, useRef, useCallback } from 'react';

const POLL_INTERVAL_MS = 4000;
const PENDING_STATUSES = new Set([
  'PENDING',
  'IN_PROGRESS',
  'IN_PROCESS',
  'PROCESSING',
  'AGGREGATING',
]);

export function useReportPolling(
  status: string | undefined,
  fetchReport: () => void | Promise<void>,
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stableRef = useRef(fetchReport);
  stableRef.current = fetchReport;

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (status && PENDING_STATUSES.has(status)) {
      queueMicrotask(() => {
        void stableRef.current();
      });
      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => stableRef.current(), POLL_INTERVAL_MS);
      }
    } else {
      stopPolling();
    }
    return stopPolling;
  }, [status, stopPolling]);
}
