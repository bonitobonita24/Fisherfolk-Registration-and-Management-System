import { FisherfolkListClient } from "./fisherfolk-list-client";

export default function FisherfolkPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fisherfolk</h1>
        <p className="text-muted-foreground">
          Manage fisherfolk registrations, profiles, and compliance records.
        </p>
      </div>
      <FisherfolkListClient />
    </div>
  );
}
