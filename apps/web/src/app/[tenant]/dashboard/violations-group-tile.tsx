import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ViolationsGroupTileProps {
  activeViolations: number;
  loading: boolean;
}

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-muted ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

export function ViolationsGroupTile({
  activeViolations,
  loading,
}: ViolationsGroupTileProps) {
  return (
    <Card>
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm">Active Violations</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {loading ? (
          <Shimmer className="h-8 w-12" />
        ) : (
          <p className="text-3xl font-bold leading-none text-foreground">
            {activeViolations.toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
