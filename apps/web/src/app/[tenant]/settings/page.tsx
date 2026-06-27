import { BarangayAliases } from "./barangay-aliases";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <p className="text-muted-foreground">
        Manage tenant settings including categories, violation types, and email configuration.
      </p>
      <BarangayAliases />
    </div>
  );
}
