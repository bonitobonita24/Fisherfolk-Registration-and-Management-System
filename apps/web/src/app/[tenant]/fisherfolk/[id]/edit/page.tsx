import { FisherfolkEditFormClient } from "./edit-form-client";

export default async function FisherfolkEditPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <FisherfolkEditFormClient id={id} />
    </div>
  );
}
