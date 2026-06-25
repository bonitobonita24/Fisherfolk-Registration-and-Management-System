import { VesselsListClient } from "./vessels-list-client";

export default function VesselsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Vessels</h1>
        <p className="text-muted-foreground">
          Manage vessel registrations, classifications, and gear types.
        </p>
      </div>
      <VesselsListClient />
    </div>
  );
}
