import { AyudaListClient } from "./ayuda-list-client";

export default function AyudaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ayuda Programs</h1>
        <p className="text-muted-foreground">
          Manage assistance programs, beneficiary verification, and distribution tracking.
        </p>
      </div>
      <AyudaListClient />
    </div>
  );
}
