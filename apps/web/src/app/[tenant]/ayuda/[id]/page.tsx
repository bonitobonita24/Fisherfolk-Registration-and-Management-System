import { AyudaDetailClient } from "./ayuda-detail-client";

export default async function AyudaProgramDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <AyudaDetailClient id={id} />
    </div>
  );
}
