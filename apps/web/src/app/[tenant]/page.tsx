import { redirect } from "next/navigation";

interface TenantRootPageProps {
  params: Promise<{ tenant: string }>;
}

/**
 * Bare tenant root (`/<slug>`) — nothing renders here; the workspace lives at
 * `/<slug>/dashboard`. Reached via custom-domain masking (the domain root
 * rewrites to `/<slug>`) or a hand-typed bare-slug URL.
 */
export default async function TenantRootPage({ params }: TenantRootPageProps) {
  const { tenant } = await params;
  redirect(`/${tenant}/dashboard`);
}
