import { FisherfolkDetailClient } from "./fisherfolk-detail-client";

export default async function FisherfolkDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <FisherfolkDetailClient id={id} />
    </div>
  );
}
