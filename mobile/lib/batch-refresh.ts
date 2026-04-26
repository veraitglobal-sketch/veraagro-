/**
 * Simple pub/sub so the batches list can reload when the socket receives `batch:updated`
 * (without mounting a second Socket.io client).
 */
type Listener = () => void;
const listeners = new Set<Listener>();

export function onBatchListRefreshRequest(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function requestBatchListRefresh(): void {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      // ignore
    }
  }
}
