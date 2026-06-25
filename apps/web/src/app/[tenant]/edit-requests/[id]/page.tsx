import { EditRequestReviewClient } from "./edit-request-review-client";

export default async function EditRequestDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <EditRequestReviewClient id={id} />
    </div>
  );
}
