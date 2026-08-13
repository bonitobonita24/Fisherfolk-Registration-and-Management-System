import { redirect } from "next/navigation";

/**
 * The staff/administrator sign-in now lives at `/admin` (kept out of the
 * public marketing landing at `/`). This route is retained only as a silent
 * redirect so any existing `/login` bookmarks, saved sessions, or in-flight
 * `callbackUrl` links continue to work unchanged.
 */
export default async function LoginRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const callbackUrl =
    typeof params.callbackUrl === "string" ? params.callbackUrl : undefined;

  redirect(
    callbackUrl
      ? `/admin?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/admin",
  );
}
