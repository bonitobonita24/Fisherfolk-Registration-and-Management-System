import { TRPCError } from "@trpc/server";
import { LRUCache } from "lru-cache";

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
  limit?: number;
};

export function rateLimit(options?: Options) {
  const tokenCache = new LRUCache<string, number[]>({
    max: options?.uniqueTokenPerInterval ?? 500,
    ttl: options?.interval ?? 60_000,
  });

  return {
    check: (token: string, limitOverride?: number) => {
      const maxRequests = limitOverride ?? options?.limit ?? 60;
      const tokenCount = tokenCache.get(token) ?? [];
      const now = Date.now();
      const windowStart = now - (options?.interval ?? 60_000);
      const requestsInWindow = tokenCount.filter((t) => t > windowStart);

      if (requestsInWindow.length >= maxRequests) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Rate limit exceeded. Try again later.",
        });
      }

      tokenCache.set(token, [...requestsInWindow, now]);
    },
  };
}

export const rateLimiters = {
  // Unauthenticated routes — lenient
  public: rateLimit({ interval: 60_000, limit: 300 }),
  // Auth endpoints (login, register, password reset) — strict
  auth: rateLimit({ interval: 60_000, limit: 10 }),
  // Authenticated API calls — moderate
  api: rateLimit({ interval: 60_000, limit: 100 }),
  // File upload endpoints — conservative
  upload: rateLimit({ interval: 60_000, limit: 20 }),
  // Media/asset download endpoints (e.g. Telegram-backed proxy) — moderate
  mediaDownload: rateLimit({ interval: 60_000, limit: 120 }),
};
