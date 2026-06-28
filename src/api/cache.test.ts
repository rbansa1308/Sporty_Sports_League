import { describe, it, expect, vi } from "vitest";
import { createCache } from "./cache";

describe("createCache", () => {
  it("returns the fetched value and stores it", async () => {
    const cache = createCache<number>();
    const fetcher = vi.fn().mockResolvedValue(42);

    const result = await cache.getOrFetch("answer", fetcher);

    expect(result).toBe(42);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("returns the cached value without calling the fetcher again", async () => {
    const cache = createCache<number>();
    const fetcher = vi.fn().mockResolvedValue(42);

    await cache.getOrFetch("answer", fetcher);
    const second = await cache.getOrFetch("answer", fetcher);

    expect(second).toBe(42);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("dedupes concurrent calls into a single fetch", async () => {
    const cache = createCache<number>();
    const fetcher = vi.fn().mockResolvedValue(7);

    const [a, b] = await Promise.all([
      cache.getOrFetch("k", fetcher),
      cache.getOrFetch("k", fetcher),
    ]);

    expect(a).toBe(7);
    expect(b).toBe(7);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("re-fetches after an entry is evicted", async () => {
    const cache = createCache<number>();
    const fetcher = vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);

    const first = await cache.getOrFetch("k", fetcher);
    cache.evict("k");
    const second = await cache.getOrFetch("k", fetcher);

    expect(first).toBe(1);
    expect(second).toBe(2);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("does not cache a rejected fetch, allowing a retry", async () => {
    const cache = createCache<number>();
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(99);

    await expect(cache.getOrFetch("k", fetcher)).rejects.toThrow("network");
    const retry = await cache.getOrFetch("k", fetcher);

    expect(retry).toBe(99);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
