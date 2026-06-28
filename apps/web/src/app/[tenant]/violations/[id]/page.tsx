import { ViolationDetailClient } from "./violation-detail-client";

export default async function ViolationDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <ViolationDetailClient id={id} />
    </div>
  );
}
