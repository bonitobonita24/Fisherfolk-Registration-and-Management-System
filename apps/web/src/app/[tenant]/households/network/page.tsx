import { PageHeader } from "@/components/shared";
import { MunicipalNetworkMap } from "./municipal-network-map";

export default function HouseholdNetworkPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Municipal Network"
        description="Barangay-level view of every household's head and connected members across Calapan City."
      />
      <div className="h-[calc(100vh-13rem)] min-h-[32rem]">
        <MunicipalNetworkMap />
      </div>
    </div>
  );
}
