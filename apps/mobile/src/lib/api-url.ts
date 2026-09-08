/**
 * Resolves the FRMS web API base URL for the mobile app.
 *
 * DEV: set EXPO_PUBLIC_API_URL to your dev machine's LAN IP, e.g.
 *   EXPO_PUBLIC_API_URL=http://192.168.1.50:44387
 * (a physical device / emulator cannot reach `localhost` on the dev machine).
 */
const envApiUrl = process.env.EXPO_PUBLIC_API_URL;

function resolveApiUrl(): string {
  if (envApiUrl && envApiUrl.length > 0) {
    return envApiUrl;
  }
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn(
      "[api-url] EXPO_PUBLIC_API_URL is not set — set it to your dev machine's LAN IP " +
        "(e.g. http://192.168.1.50:44387) or requests will fail on a physical device/emulator.",
    );
    return "http://localhost:44387";
  }
  throw new Error(
    "EXPO_PUBLIC_API_URL is not set. This must be configured at build time for production/APK builds.",
  );
}

export const API_URL = resolveApiUrl();

export const TRPC_URL = `${API_URL}/api/trpc`;
