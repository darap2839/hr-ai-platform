import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdvancedSSEClient from '../../api/sse';

let sources;
beforeEach(() => {
  vi.useFakeTimers();
  sources = [];
  vi.stubGlobal('EventSource', class {
    constructor(url) { this.url = url; this.close = vi.fn(); sources.push(this); }
    addEventListener() {}
  });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('notification connection lifecycle', () => {
  it('cancels a pending retry when the user logs out', async () => {
    const client = new AdvancedSSEClient('old-token');
    await client.connect();
    sources[0].onerror(new Event('error'));
    client.disconnect();
    await vi.advanceTimersByTimeAsync(60000);
    expect(sources).toHaveLength(1);
    expect(client.isConnected).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('ignores late events from a closed connection after logout', async () => {
    const client = new AdvancedSSEClient('old-token');
    await client.connect();
    const lateError = sources[0].onerror;
    const lateOpen = sources[0].onopen;
    client.disconnect();
    expect(() => lateError(new Event('error'))).not.toThrow();
    lateOpen();
    await vi.advanceTimersByTimeAsync(60000);
    expect(sources).toHaveLength(1);
    expect(client.isConnected).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('retries a network error while the session is active', async () => {
    const client = new AdvancedSSEClient('token');
    await client.connect();
    sources[0].onerror(new Event('error'));
    await vi.advanceTimersByTimeAsync(1000);
    expect(sources).toHaveLength(2);
    client.disconnect();
  });

  it('replaces the connection token without reviving the old connection', async () => {
    const client = new AdvancedSSEClient('old-token');
    await client.connect();
    const lateError = sources[0].onerror;
    sources[0].onerror(new Event('error'));
    client.disconnect();
    client.authToken = 'new-token';
    await client.connect();
    lateError(new Event('error'));
    await vi.advanceTimersByTimeAsync(1000);
    expect(sources).toHaveLength(2);
    expect(new URL(sources[1].url).searchParams.get('token')).toBe('new-token');
    expect(sources[1].close).not.toHaveBeenCalled();
    client.disconnect();
  });
});
