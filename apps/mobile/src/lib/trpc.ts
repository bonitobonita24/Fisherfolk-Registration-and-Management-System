// TYPE-ONLY import — never a runtime import of server/db code (Rule 13).
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { AppRouter } from "@frms/web-router";
import { createApiClient, httpBatchLink } from "@frms/api-client";
import { TRPC_URL } from "./api-url";

export type MobileTrpcClient = ReturnType<typeof createApiClient<AppRouter>>;

/**
 * Builds a vanilla tRPC client for the mobile app. `getToken` is called on every
 * request so a signed-in/signed-out transition is always reflected in the next call.
 */
export function makeTrpcClient(getToken: () => Promise<string | null>): MobileTrpcClient {
  return createApiClient<AppRouter>([
    httpBatchLink({
      url: TRPC_URL,
      async headers() {
        const token = await getToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ]);
}
