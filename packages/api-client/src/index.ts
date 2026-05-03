import { createTRPCClient, httpBatchLink, type TRPCLink } from "@trpc/client";
import type { AnyRouter } from "@trpc/server";

export type { AnyRouter } from "@trpc/server";

export function createApiClient<TRouter extends AnyRouter>(
  links: TRPCLink<TRouter>[],
) {
  return createTRPCClient<TRouter>({ links });
}

export { createTRPCClient, httpBatchLink } from "@trpc/client";
