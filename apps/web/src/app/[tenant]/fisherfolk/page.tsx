import { PageHeader } from "@/components/shared";
import { FisherfolkListClient } from "./fisherfolk-list-client";

export default function FisherfolkPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Fisherfolk"
        description="Manage fisherfolk registrations, profiles, and compliance records."
      />
      <FisherfolkListClient />
    </div>
  );
}
