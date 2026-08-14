import { BarangayDensityMap } from "../dashboard/barangay-density-map";

export default function MapPage() {
  return (
    <div className="space-y-6">
      <div className="flex shrink-0 flex-col gap-1 pt-4 pb-4">
        <h1 className="truncate text-base font-semibold tracking-tight text-foreground">Map</h1>
        <p className="text-xs text-muted-foreground">
          Geographic density map by barangay — switch between registered
          fisherfolk, vessels, ayuda beneficiaries, and violations.
        </p>
      </div>
      <BarangayDensityMap />
    </div>
  );
}
