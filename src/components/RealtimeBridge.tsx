import { useEffect, useState } from 'react';
import api from '../lib/api';
import { publishRealtimeChange } from '../services/realtime.service';

const reconnectDelay = (attempt: number) => Math.min(1_000 * 2 ** Math.min(attempt, 5), 30_000);

function storedToken(): string | null {
  return localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token');
}

export function RealtimeBridge() {
  const [token, setToken] = useState(storedToken);

  useEffect(() => {
    const syncToken = () => setToken(storedToken());
    window.addEventListener('auth-change', syncToken);
    window.addEventListener('storage', syncToken);
    return () => {
      window.removeEventListener('auth-change', syncToken);
      window.removeEventListener('storage', syncToken);
    };
  }, []);

  useEffect(() => {
    if (!token) return;

    let stopped = false;
    let activeController: AbortController | null = null;

    const dispatchResync = () => publishRealtimeChange({ module: 'global', action: 'RESYNC' });
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') dispatchResync();
    };
    const onOnline = () => {
      dispatchResync();
      activeController?.abort();
    };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisibilityChange);

    const connect = async () => {
      let attempt = 0;
      while (!stopped) {
        activeController = new AbortController();
        try {
          const baseUrl = String(api.defaults.baseURL || window.location.origin).replace(/\/+$/, '');
          const response = await fetch(`${baseUrl}/api/realtime/events`, {
            headers: { Authorization: `Bearer ${storedToken() || token}`, Accept: 'text/event-stream' },
            signal: activeController.signal,
          });
          if (response.status === 401) {
            await api.get('/api/auth/me');
            continue;
          }
          if (!response.ok || !response.body) {
            throw new Error(`Connexion temps réel refusée (${response.status})`);
          }

          attempt = 0;
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let eventName = 'message';
          let data: string[] = [];

          while (!stopped) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (!line) {
                if (eventName === 'change' && data.length) {
                  publishRealtimeChange(JSON.parse(data.join('\n')) as {
                    id?: number; module: string; action?: string; occurredAt?: string;
                  });
                } else if (eventName === 'resync') {
                  dispatchResync();
                }
                eventName = 'message';
                data = [];
              } else if (line.startsWith('event:')) {
                eventName = line.slice(6).trim();
              } else if (line.startsWith('data:')) {
                data.push(line.slice(5).trimStart());
              }
            }
          }
          if (!stopped) throw new Error('Flux temps réel interrompu');
        } catch (error) {
          if (stopped || (error instanceof DOMException && error.name === 'AbortError')) continue;
          console.warn('Connexion temps réel interrompue; nouvelle tentative programmée.', error);
          await new Promise((resolve) => window.setTimeout(resolve, reconnectDelay(attempt++)));
        }
      }
    };

    void connect();
    return () => {
      stopped = true;
      activeController?.abort();
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [token]);

  return null;
}
