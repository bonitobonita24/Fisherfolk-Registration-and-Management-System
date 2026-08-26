import { notFound } from "next/navigation";
import { z } from "zod";

import { FisherfolkEditFormClient } from "./edit-form-client";

// Same guard as the detail route: the URL `id` is the cuid primary key, so a
// non-cuid segment renders a clean 404 rather than reaching the tRPC query and
// returning a BAD_REQUEST (HTTP 400).
const idSchema = z.string().cuid();

export default async function FisherfolkEditPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();
  return (
    <div className="space-y-6">
      <FisherfolkEditFormClient id={id} />
    </div>
  );
}
