/**
 * In-memory cache keyed by string. Stores the in-flight Promise so that
 * concurrent requests for the same key dedupe into a single fetch. A rejected
 * fetch is evicted so callers can retry.
 */
export interface Cache<T> {
  getOrFetch(key: string, fetcher: () => Promise<T>): Promise<T>;
}

export function createCache<T>(): Cache<T> {
  const entries = new Map<string, Promise<T>>();

  return {
    getOrFetch(key, fetcher) {
      const existing = entries.get(key);
      if (existing) return existing;

      const pending = fetcher().catch((error) => {
        entries.delete(key);
        throw error;
      });

      entries.set(key, pending);
      return pending;
    },
  };
}
