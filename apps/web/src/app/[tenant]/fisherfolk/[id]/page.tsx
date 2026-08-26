import { notFound } from "next/navigation";
import { z } from "zod";

import { FisherfolkDetailClient } from "./fisherfolk-detail-client";

// The record `id` in the URL is the cuid primary key (mirrors the
// fisherfolk.getById input schema). A non-cuid segment — e.g. a stale
// `/fisherfolk/new` bookmark that matches this `[id]` route with id="new" —
// would otherwise reach the tRPC query and fail Zod's `.cuid()` check as a
// BAD_REQUEST (HTTP 400) instead of a clean not-found. Guard here so any
// invalid id renders a proper 404.
const idSchema = z.string().cuid();

export default async function FisherfolkDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  return (
    <div className="space-y-6">
      <FisherfolkDetailClient id={id} />
    </div>
  );
}
