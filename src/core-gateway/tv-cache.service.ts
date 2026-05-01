import { Injectable } from '@nestjs/common';

interface CacheEntry {
  expiresAt: number;
  data: unknown;
}

@Injectable()
export class TvSnapshotCacheService {
  private readonly ttlMs = Number(process.env.EQUEUE_TV_CACHE_TTL_MS ?? 2000);
  private readonly cache = new Map<string, CacheEntry>();

  async getOrLoad<T>(key: string, loader: () => Promise<T>): Promise<T> {
    if (this.ttlMs <= 0) {
      return loader();
    }

    const now = Date.now();
    const cached = this.cache.get(key);

    if (cached && cached.expiresAt > now) {
      return cached.data as T;
    }

    const data = await loader();
    this.cache.set(key, {
      data,
      expiresAt: now + this.ttlMs,
    });

    return data;
  }
}
