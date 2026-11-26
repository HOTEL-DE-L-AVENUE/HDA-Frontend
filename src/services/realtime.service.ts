export interface RealtimeChange {
  id?: number;
  module: string;
  action?: string;
  occurredAt?: string;
}

const REALTIME_EVENT = 'hda:realtime-change';

export function publishRealtimeChange(change: RealtimeChange): void {
  window.dispatchEvent(new CustomEvent<RealtimeChange>(REALTIME_EVENT, { detail: change }));
}

export function onRealtimeChange(listener: (change: RealtimeChange) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<RealtimeChange>).detail);
  window.addEventListener(REALTIME_EVENT, handler);
  return () => window.removeEventListener(REALTIME_EVENT, handler);
}
