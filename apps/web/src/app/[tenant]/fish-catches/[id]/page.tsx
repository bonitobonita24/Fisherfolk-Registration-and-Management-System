import { FishCatchDetailClient } from "./fish-catch-detail-client";

export default async function FishCatchDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <FishCatchDetailClient id={id} />
    </div>
  );
}
