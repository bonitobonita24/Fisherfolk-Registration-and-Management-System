import { PageHeader } from "@/components/shared";
import { BarangayDensityMap } from "../dashboard/barangay-density-map";

export default function MapPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Map"
        description="Geographic density map by barangay — switch between registered fisherfolk, vessels, ayuda beneficiaries, and violations."
      />
      <BarangayDensityMap />
    </div>
  );
}
