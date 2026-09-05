import { PageHeader } from "@/components/shared";
import { BarangayDensityMap } from "../insights/barangay-density-map";

export default function MapPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Map"
        description="Geographic density map by barangay — switch between registered fisherfolk, vessels, ayuda beneficiaries, and violations."
      />
      {/*
       * BarangayDensityMap is a `h-full` Card (it fills the fixed-height
       * dashboard grid cell it was designed for). On this standalone page it
       * has no height ancestor, so `h-full`/`lg:h-full` collapse the MapLibre
       * container to 0 and the map renders blank. Give it an explicit viewport
       * height here so the same component renders identically to the dashboard.
       */}
      <div className="h-[calc(100vh-13rem)] min-h-[32rem]">
        <BarangayDensityMap />
      </div>
    </div>
  );
}
