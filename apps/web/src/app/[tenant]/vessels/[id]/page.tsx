import { VesselDetailClient } from "./vessel-detail-client";

export default async function VesselDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <VesselDetailClient id={id} />
    </div>
  );
}
