import { HouseholdDetailClient } from "./household-detail-client";

export default async function HouseholdDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <HouseholdDetailClient id={id} />
    </div>
  );
}
