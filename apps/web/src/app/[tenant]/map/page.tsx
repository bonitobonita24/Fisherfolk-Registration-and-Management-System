import { BarangayDensityMap } from "../dashboard/barangay-density-map";

export default function MapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Map</h1>
        <p className="text-muted-foreground">
          Geographic density map by barangay — switch between registered
          fisherfolk, vessels, ayuda beneficiaries, and violations.
        </p>
      </div>
      <BarangayDensityMap />
    </div>
  );
}
